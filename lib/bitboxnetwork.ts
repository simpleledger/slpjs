import BITBOX from '../node_modules/bitbox-sdk/typings/bitbox-sdk';
import BigNumber from 'bignumber.js';
import _ from 'lodash';
import bchaddr from 'bchaddrjs';
import { AddressUtxoResult } from 'bitbox-sdk/typings/Address';
import { AddressUtxoResultExtended, TokenBalancesResult } from '..';

import { Slp } from './slp';
import { ProxyValidation } from './proxyvalidation';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

export class BitboxNetwork {
    BITBOX: BITBOX;
    slp: Slp;
    validator: ProxyValidation;

    constructor(BITBOX: BITBOX, proxyUrl='https://validate.simpleledger.info') {
        this.BITBOX = BITBOX;
        this.slp = new Slp();
        this.validator = new ProxyValidation(proxyUrl);
    }
    
    async getUtxo(address: string) {
        // must be a cash or legacy addr
        if(!bchaddr.isCashAddress(address) && !bchaddr.isLegacyAddress(address)) 
            throw new Error("Not an a valid address format, must be cashAddr or Legacy address format.");
        let res = await this.BITBOX.Address.utxo(address);
        return res;
    }

    async getAllTokenBalancesFromUtxos(utxos: AddressUtxoResultExtended[]) {

        // try to parse out SLP object from SEND or GENESIS txn type
        for(let txOut of utxos) {
            try {
                txOut.slp = this.slp.decodeTxOut(txOut);
            } catch(e) {
                if(e.message === "Possible mint baton"){
                    txOut.baton = true;
                }
            }
        }

        // getcset of VALID SLP txn ids
        let validSLPTx: string[] = await this.validator.validateTransactions([
            ...new Set(utxos.filter(txOut => {
                if(txOut.slp == undefined){
                    return false;
                }
                return true;
            }).map(txOut => txOut.txid))
        ]);

        const bals: TokenBalancesResult = {
            satoshis_available: 0,
            satoshis_locked_in_minting_baton: 0,
            satoshis_locked_in_token: 0
        };

        // loop through UTXO set and accumulate balances for each valid token.
        for (const txOut of utxos) {
            if ("slp" in txOut && txOut.txid in validSLPTx) {
                if (!(txOut.slp.token in bals)) {
                    bals[txOut.slp.token] = new BigNumber(0);
                }
                bals[txOut.slp.token] = bals[txOut.slp.token].plus(
                    txOut.slp.quantity
                );
                bals.satoshis_locked_in_token += txOut.satoshis;
            } else if(txOut.baton === true) {
                bals.satoshis_locked_in_minting_baton += txOut.satoshis;
            } else {
                bals.satoshis_available += txOut.satoshis;
            }
        }

        return bals;
    }

    async getAllTokenBalances(address: string) {
        // convert address to cashAddr if needed
        address = bchaddr.toCashAddress(address);

        let UTXOset = await this.getUtxoWithTxDetails(address);

        return await this.getAllTokenBalancesFromUtxos(UTXOset);
    }

    // fundingAddress and tokenReceiverAddress must be in SLP format.
    async sendToken(tokenId: string, sendAmount: BigNumber, fundingAddress: string, fundingWif: string, tokenReceiverAddress: string, changeReceiverAddress: string) {
    
        // convert address to cashAddr from SLP format.
        let fundingAddress_cashfmt = bchaddr.toCashAddress(fundingAddress);

        // 1) Get all utxos for our address and filter out UTXOs for other tokens
        let inputUtxoSet: AddressUtxoResultExtended[] = [];
        let utxoSet = await this.getUtxoWithTxDetails(fundingAddress_cashfmt);
        for(let utxo of utxoSet){
            try {
                utxo.slp = this.slp.decodeTxOut(utxo);
                if(utxo.slp.token != tokenId)
                    continue;
            } catch(_) {}
            
            // sweeping inputs is easiest way to manage coin selection
            inputUtxoSet.push(utxo);
        }

        // find the valid SLP tokens and compute the valid input balance.
        let validSLPTx = await this.validator.validateTransactions([
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
            if ("slp" in txOut && txOut.txid in validSLPTx) {
                validTokenQuantity = validTokenQuantity.plus(txOut.slp.quantity);
            }
        }

        //inputUtxoSet = inputUtxoSet.map(utxo => ({ txid: utxo.txid, vout: utxo.vout, satoshis: utxo.satoshis, wif: fundingWif }));
        //console.log(inputUtxoSet);

        // 2) Set the token send amounts, we'll send 100 tokens to a new receiver and send token change back to the sender
        let tokenChangeAmount = validTokenQuantity.minus(sendAmount);
        let sendOpReturn;
        let txHex;

        if(tokenChangeAmount.isGreaterThan(new BigNumber(0))){
            // 3) Create the Send OP_RETURN message
            sendOpReturn = this.slp.buildSendOpReturn({
                tokenIdHex: tokenId,
                outputQtyArray: [sendAmount, tokenChangeAmount],
            });
            // 4) Create the raw Send transaction hex
            txHex = this.slp.buildRawSendTx({
                slpSendOpReturn: sendOpReturn,
                input_token_utxos: inputUtxoSet,
                tokenReceiverAddressArray: [
                    tokenReceiverAddress, changeReceiverAddress
                ],
                bchChangeReceiverAddress: changeReceiverAddress
            });
        } else{
            // 3) Create the Send OP_RETURN message
            sendOpReturn = this.slp.buildSendOpReturn({
                tokenIdHex: tokenId,
                outputQtyArray: [sendAmount],
            });

            // 4) Create the raw Send transaction hex
            txHex = this.slp.buildRawSendTx({
                slpSendOpReturn: sendOpReturn,
                input_token_utxos: inputUtxoSet,
                tokenReceiverAddressArray: [
                    tokenReceiverAddress
                ],
                bchChangeReceiverAddress: changeReceiverAddress
            });
        }

        console.log(txHex);

        // 5) Broadcast the transaction over the network using this.BITBOX
        return await this.sendTx(txHex);
    }

    async getUtxoWithRetry(address: string, retries = 40) {
		let result: AddressUtxoResult[][];
		let count = 0;
		while(result == undefined){
			result = await this.getUtxo(address)
			count++;
			if(count > retries)
				throw new Error("this.BITBOX.Address.utxo endpoint experienced a problem");
			await sleep(250);
		}
		return result;
    }

    async getUtxoWithTxDetails(address: string) {
        const set: AddressUtxoResultExtended[] = await this.getUtxoWithRetry(address)[0];
        let txIds = set.map(i => i.txid)
    
        if(txIds.length === 0){
            return [];
        }
    
        // Split txIds into chunks of 20 (BitBox limit), run the detail queries in parallel
        let txDetails: any[] = await Promise.all(_.chunk(txIds, 20).map(txIdchunk => {
            return this.getTransactionDetailsWithRetry(txIdchunk);
        }));
    
        // concat the chunked arrays
        txDetails = [].concat(...txDetails);
    
        for(let i = 0; i < set.length; i++){
            set[i].tx = txDetails[i];
        }
    
        return set;
    }
    
    async getTransactionDetailsWithRetry(txid, retries = 40) {
        let result;
        let count = 0;
        while(result == undefined){
            result = await this.BITBOX.Transaction.details(txid);
            count++;
            if(count > retries)
                throw new Error("this.BITBOX.Address.details endpoint experienced a problem");

            await sleep(250);
        }
        return result; 
    }

	async getAddressDetailsWithRetry(address, retries = 40) {
        // must be a cash or legacy addr
        if(!bchaddr.isCashAddress(address) && !bchaddr.isLegacyAddress(address)) 
            throw new Error("Not an a valid address format, must be cashAddr or Legacy address format.");
		let result;
		let count = 0;
		while(result == undefined){
			result = await this.BITBOX.Address.details(address);
			count++;
			if(count > retries)
				throw new Error("this.BITBOX.Address.details endpoint experienced a problem");

			await sleep(250);
		}
		return result;
	}

    async sendTx(hex) {
        let res = await this.BITBOX.RawTransactions.sendRawTransaction(hex);
        console.log(res);
        return res;
    }

    async monitorForPayment(paymentAddress, fee, onPaymentCB) {
        // must be a cash or legacy addr
        if(!bchaddr.isCashAddress(paymentAddress) && !bchaddr.isLegacyAddress(paymentAddress)) 
            throw new Error("Not an a valid address format, must be cashAddr or Legacy address format.");
        
        while (true) {
            try {
                let utxo = (await this.getUtxo(paymentAddress))[0][0]
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
