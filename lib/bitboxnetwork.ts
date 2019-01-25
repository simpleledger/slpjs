import BITBOX from '../node_modules/bitbox-sdk/typings/bitbox-sdk';
import BigNumber from 'bignumber.js';
import * as _ from 'lodash';
import * as bchaddr from 'bchaddrjs-slp';

import { AddressUtxoResult, AddressDetailsResult } from 'bitbox-sdk/typings/Address';
import { SlpAddressUtxoResult, SlpBalancesResult, SlpUtxoJudgement, SlpTransactionType } from './slpjs';

import { Slp } from './slp';
import { ProxyValidation } from './proxyvalidation';
import { TxnDetails } from 'bitbox-sdk/typings/Transaction';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

export class BitboxNetwork {
    BITBOX: BITBOX;
    slp: Slp;
    validator: ProxyValidation;

    constructor(BITBOX: BITBOX, proxyValidationUrl: string) {
        this.BITBOX = BITBOX;
        this.slp = new Slp(BITBOX);
        this.validator = new ProxyValidation(BITBOX, proxyValidationUrl);
    }
    
    async getUtxo(address: string) {
        // must be a cash or legacy addr
        let res: AddressUtxoResult[];
        if(!bchaddr.isCashAddress(address) && !bchaddr.isLegacyAddress(address)) 
            throw new Error("Not an a valid address format, must be cashAddr or Legacy address format.");
        res = (await this.BITBOX.Address.utxo([address]))[0];
        return res;
    }

    async getAllSlpBalancesAndUtxos(address: string) {

        // convert address to cashAddr if needed
        address = bchaddr.toCashAddress(address);

        let UTXOset = await this.getUtxoWithTxDetails(address);
        //console.log('utxos:', UTXOset);

        return await this.validator.processUtxosForSlp(UTXOset);
    }

    // Sent SLP tokens to a single output address with change handled (Warning: Sweeps all BCH/SLP UTXOs for the funding address)
    async simpleTokenSend(tokenId: string, sendAmount: BigNumber, fundingAddress: string, fundingWif: string, tokenReceiverAddress: string, changeReceiverAddress: string) {  
        // convert address to cashAddr from SLP format.
        let fundingAddress_cashfmt = bchaddr.toCashAddress(fundingAddress);

        // 1) Get SLP Balances and organized UTXOs
        let balances = await this.getAllSlpBalancesAndUtxos(fundingAddress);

        // 2) Get UTXOs for this token.
        let tokenUtxos = balances.slpTokenUtxos.filter(utxo => utxo.slpTokenDetails.tokenIdHex === tokenId);
        
        // 3) Set the private key for all
        tokenUtxos.forEach(utxo => utxo.wif = fundingWif );
        balances.nonSlpUtxos.forEach(utxo => utxo.wif = fundingWif);
        let inputUtxoSet = [].concat(tokenUtxos).concat(balances.nonSlpUtxos);

        // 2) Set the token send amounts, we'll send 100 tokens to a new receiver and send token change back to the sender
        let tokenChangeAmount = balances.slpTokenBalances[tokenId].minus(sendAmount);
        let sendOpReturn;
        let txHex;

        if(tokenChangeAmount.isGreaterThan(new BigNumber(0))){
            // 3) Create the Send OP_RETURN message
            sendOpReturn = this.slp.buildSendOpReturn({
                tokenIdHex: tokenId,
                outputQtyArray: [ sendAmount, tokenChangeAmount ],
            });
            // 4) Create the raw Send transaction hex
            txHex = this.slp.buildRawSendTx({
                slpSendOpReturn: sendOpReturn,
                input_token_utxos: inputUtxoSet,
                tokenReceiverAddressArray: [ tokenReceiverAddress, changeReceiverAddress ],
                bchChangeReceiverAddress: changeReceiverAddress
            });
        } else if (tokenChangeAmount.isEqualTo(new BigNumber(0))) {
            // 3) Create the Send OP_RETURN message
            sendOpReturn = this.slp.buildSendOpReturn({
                tokenIdHex: tokenId,
                outputQtyArray: [ sendAmount ],
            });
            // 4) Create the raw Send transaction hex
            txHex = this.slp.buildRawSendTx({
                slpSendOpReturn: sendOpReturn,
                input_token_utxos: inputUtxoSet,
                tokenReceiverAddressArray: [ tokenReceiverAddress ],
                bchChangeReceiverAddress: changeReceiverAddress
            });
        } else {
            throw Error('Token quantity inputs less than the token inputs')
        }

        console.log(txHex);

        // 5) Broadcast the transaction over the network using this.BITBOX
        return await this.sendTx(txHex);
    }

    // Sent SLP tokens to a single output address with change handled (Warning: Sweeps all BCH/SLP UTXOs for the funding address)
    async simpleTokenMint(tokenId: string, mintAmount: BigNumber, inputUtxos: SlpAddressUtxoResult[], tokenReceiverAddress: string, batonReceiverAddress: string, changeReceiverAddress: string) {  
        // // convert address to cashAddr from SLP format.
        // let fundingAddress_cashfmt = bchaddr.toCashAddress(fundingAddress);

        // 1) Create the Send OP_RETURN message
        let mintOpReturn = this.slp.buildMintOpReturn({
            tokenIdHex: tokenId,
            mintQuantity: mintAmount,
            batonVout: 2
        });

        // 4) Create the raw Mint transaction hex
        let txHex = this.slp.buildRawMintTx({
            input_baton_utxos: inputUtxos,
            slpMintOpReturn: mintOpReturn,
            mintReceiverAddress: tokenReceiverAddress,
            batonReceiverAddress: batonReceiverAddress,
            bchChangeReceiverAddress: changeReceiverAddress
        });
        
        console.log(txHex);

        // 5) Broadcast the transaction over the network using this.BITBOX
        return await this.sendTx(txHex);
    }

    async getUtxoWithRetry(address: string, retries = 40) {
		let result: AddressUtxoResult[] | undefined;
		let count = 0;
		while(result === undefined){
			result = await this.getUtxo(address)
			count++;
			if(count > retries)
				throw new Error("this.BITBOX.Address.utxo endpoint experienced a problem");
			await sleep(250);
		}
		return result;
    }

    async getUtxoWithTxDetails(address: string) {
        const utxos = <SlpAddressUtxoResult[]>(await this.getUtxoWithRetry(address));
        
        let txIds = utxos.map(i => i.txid)
    
        if(txIds.length === 0){
            return [];
        }
    
        // Split txIds into chunks of 20 (BitBox limit), run the detail queries in parallel
        let txDetails: any[] = await Promise.all(_.chunk(txIds, 20).map((txids: string[]) => {
            return this.getTransactionDetailsWithRetry(txids);
        }));
    
        // concat the chunked arrays
        txDetails = <TxnDetails[]>[].concat(...txDetails);
    
        for(let i = 0; i < utxos.length; i++){
            utxos[i].tx = txDetails[i];
        }
    
        return utxos;
    }
    
    async getTransactionDetailsWithRetry(txids: string[], retries = 40) {
        let result: TxnDetails|TxnDetails[];
        let count = 0;
        while(result === undefined){
            result = (await this.BITBOX.Transaction.details(txids));
            count++;
            if(count > retries)
                throw new Error("this.BITBOX.Address.details endpoint experienced a problem");

            await sleep(500);
        }
        return result; 
    }

	async getAddressDetailsWithRetry(address: string, retries = 40) {
        // must be a cash or legacy addr
        if(!bchaddr.isCashAddress(address) && !bchaddr.isLegacyAddress(address)) 
            throw new Error("Not an a valid address format, must be cashAddr or Legacy address format.");
		let result: AddressDetailsResult[] | undefined;
		let count = 0;
		while(result === undefined){
			result = await this.BITBOX.Address.details([address]);
			count++;
			if(count > retries)
				throw new Error("this.BITBOX.Address.details endpoint experienced a problem");

			await sleep(250);
		}
		return result;
	}

    async sendTx(hex: string) {
        let res = await this.BITBOX.RawTransactions.sendRawTransaction(hex);
        //console.log(res);
        return res;
    }

    async monitorForPayment(paymentAddress: string, fee: number, onPaymentCB: Function) {
        // must be a cash or legacy addr
        if(!bchaddr.isCashAddress(paymentAddress) && !bchaddr.isLegacyAddress(paymentAddress)) 
            throw new Error("Not an a valid address format, must be cashAddr or Legacy address format.");
        
        while (true) {
            try {
                let utxo = (await this.getUtxo(paymentAddress))[0];
                if (utxo && utxo.satoshis >= fee) {
                    break
                }
            } catch (ex) {
                console.log(ex)
            }
            await sleep(2000)
        }
        onPaymentCB()
    }
}
