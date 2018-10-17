let BITBOXSDK = require('bitbox-sdk/lib/bitbox-sdk').default;
let BITBOX = new BITBOXSDK();
let BigNumber = require("bignumber.js");

let slp = require('./slp');
let bitdb = require('./bitdbproxy');

let bchaddr = require('bchaddrjs-slp');
let _  = require('lodash');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

module.exports = class BitboxNetwork {
    static async getUtxo(address) {
        // must be a cash or legacy addr
        if(!bchaddr.isCashAddress(address) && !bchaddr.isLegacyAddress(address)) 
            throw new Error("Not an a valid address format, must be cashAddr or Legacy address format.");
        let res = await BITBOX.Address.utxo(address);
        return res;
    }

    static async getAllTokenBalancesFromUtxos(utxos) {

        // try to parse out SLP object from SEND or GENESIS txn type
        for(let txOut of utxos) {
            try {
                txOut.slp = slp.decodeTxOut(txOut);
            } catch(e) {
                if(e.message === "Possible mint baton"){
                    txOut.baton = true;
                }
            }
        }

        // getcset of VALID SLP txn ids
        let validSLPTx = await bitdb.verifyTransactions([
            ...new Set(utxos.filter(txOut => {
                if(txOut.slp == undefined){
                    return false;
                }
                return true;
            }).map(txOut => txOut.txid))
        ]);

        const bals = {
            satoshis_available: 0,
            satoshis_locked_in_minting_baton: 0,
            satoshis_locked_in_token: 0
        };

        // loop through UTXO set and accumulate balances for each valid token.
        for (const txOut of utxos) {
            if ("slp" in txOut && validSLPTx.includes(txOut.txid)) {
                if (!(txOut.slp.token in bals)) {
                    bals[txOut.slp.token] = new BigNumber(0);
                }
                bals[txOut.slp.token] = bals[txOut.slp.token].plus(
                    txOut.slp.quantity
                );
                bals.satoshis_locked_in_token += txOut.satoshis;
            } else if("baton" in txOut) {
                bals.satoshis_locked_in_minting_baton += txOut.satoshis;
            } else {
                bals.satoshis_available += txOut.satoshis;
            }
        }

        return bals;
    }

    // first implementation of getTokenBalances -- could also be done using bitdb2.0
    static async getAllTokenBalances(address) {
        // convert address to cashAddr if needed
        address = bchaddr.toCashAddress(address);

        let UTXOset = await BitboxNetwork.getUtxoWithTxDetails(address);

        return await BitboxNetwork.getAllTokenBalancesFromUtxos(UTXOset);
    }

    // fundingAddress and tokenReceiverAddress must be in SLP format.
    static async sendToken(tokenId, sendAmount, fundingAddress, fundingWif, tokenReceiverAddress, bchChangeReceiverAddress){
    
        // convert address to cashAddr from SLP format.
        let fundingAddress_cashfmt = bchaddr.toCashAddress(fundingAddress);

        // 1) Get all utxos for our address and filter out UTXOs for other tokens
        let inputUtxoSet = [];
        let utxoSet = await BitboxNetwork.getUtxoWithTxDetails(fundingAddress_cashfmt);
        for(let utxo of utxoSet){
            try {
                utxo.slp = slp.decodeTxOut(utxo);
                if(utxo.slp.token != tokenId)
                    continue;
            } catch(_) {}
            
            // sweeping inputs is easiest way to manage coin selection
            inputUtxoSet.push(utxo);
        }

        // find the valid SLP tokens and compute the valid input balance.
        let validSLPTx = await bitdb.verifyTransactions([
            ...new Set(utxoSet.filter(txOut => {
                if(txOut.slp == undefined){
                    return false;
                }
                if(txOut.slp.token != tokenId){
                    return false;
                }
                return true;
            }).map(txOut => txOut.txid))
        ]);
        let validTokenQuantity = new BigNumber(0);
        
        for (const txOut of inputUtxoSet) {
            if ("slp" in txOut && validSLPTx.includes(txOut.txid)) {
                validTokenQuantity = validTokenQuantity.plus(txOut.slp.quantity);
            }
        }

        inputUtxoSet = inputUtxoSet.map(utxo => ({ txid: utxo.txid, vout: utxo.vout, satoshis: utxo.satoshis, wif: fundingWif }));
        console.log(inputUtxoSet);

        // 2) Set the token send amounts, we'll send 100 tokens to a new receiver and send token change back to the sender
        let tokenChangeAmount = validTokenQuantity.minus(sendAmount);

        // 3) Create the Send OP_RETURN message
        let sendOpReturn = slp.buildSendOpReturn({
            tokenIdHex: tokenId,
            outputQtyArray: [sendAmount, tokenChangeAmount],
        })

        // 4) Create the raw Send transaction hex
        let txHex = slp.buildRawSendTx({
            slpSendOpReturn: sendOpReturn,
            input_token_utxos: inputUtxoSet,
            tokenReceiverAddressArray: [
                tokenReceiverAddress, fundingAddress
            ],
            bchChangeReceiverAddress: bchChangeReceiverAddress
        })

        console.log(txHex);
        // 5) Broadcast the transaction over the network using BITBOX
        return await BitboxNetwork.sendTx(txHex);
    }

    static async getUtxoWithRetry(address, retries = 40){
		let result;
		let count = 0;
		while(result == undefined){
			result = await BitboxNetwork.getUtxo(address)
			count++;
			if(count > retries)
				throw new Error("BITBOX.Address.utxo endpoint experienced a problem");
			await sleep(250);
		}
		return result;
    }

    static async getUtxoWithTxDetails(address){
        const set = await BitboxNetwork.getUtxoWithRetry(address);
        let txIds = set.map(i => i.txid)
    
        if(txIds.length === 0){
            return [];
        }
    
        // Split txIds into chunks of 20 (BitBox limit), run the detail queries in parallel
        let txDetails = await Promise.all(_.chunk(txIds, 20).map(txIdchunk => {
            return BitboxNetwork.getTransactionDetailsWithRetry(txIdchunk);
        }));
    
        // concat the chunked arrays
        txDetails = [].concat(...txDetails);
    
        for(let i = 0; i < set.length; i++){
            set[i].tx = txDetails[i];
        }
    
        return set;
    }
    
    static async getTransactionDetailsWithRetry(txid, retries = 40){
        let result;
        let count = 0;
        while(result == undefined){
            result = await BITBOX.Transaction.details(txid);
            count++;
            if(count > retries)
                throw new Error("BITBOX.Address.details endpoint experienced a problem");

            await sleep(250);
        }
        return result; 
    }

	static async getAddressDetailsWithRetry(address, retries = 40){
        // must be a cash or legacy addr
        if(!bchaddr.isCashAddress(address) && !bchaddr.isLegacyAddress(address)) 
            throw new Error("Not an a valid address format, must be cashAddr or Legacy address format.");
		let result;
		let count = 0;
		while(result == undefined){
			result = await BITBOX.Address.details(address);
			count++;
			if(count > retries)
				throw new Error("BITBOX.Address.details endpoint experienced a problem");

			await sleep(250);
		}
		return result;
	}

    static async sendTx(hex) {
        let res = await BITBOX.RawTransactions.sendRawTransaction(hex);
        console.log(res);
        return res;
    }

    static async monitorForPayment(paymentAddress, fee, onPaymentCB) {
        // must be a cash or legacy addr
        if(!bchaddr.isCashAddress(paymentAddress) && !bchaddr.isLegacyAddress(paymentAddress)) 
            throw new Error("Not an a valid address format, must be cashAddr or Legacy address format.");
        
        while (true) {
            try {
                let utxo = (await BitboxNetwork.getUtxo(paymentAddress))[0]
                if (utxo && utxo.satoshis >= fee) {
                    break
                }
            } catch (ex) {
                console.log(ex)
            }
            await sleep(5000)
        }
        onPaymentCB()
    }
}
