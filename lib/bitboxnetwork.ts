import { SlpAddressUtxoResult, SlpTransactionDetails, SlpBalancesResult, logger, SlpTransactionType } from '../index';
import { Slp, SlpProxyValidator, SlpValidator } from './slp';
import { Utils } from './utils';

import { BITBOX } from 'bitbox-sdk';
import { AddressUtxoResult, AddressDetailsResult, TxnDetailsResult, VerboseRawTransactionResult } from 'bitcoin-com-rest';
import BigNumber from 'bignumber.js';
import * as _ from 'lodash';
import * as bchaddr from 'bchaddrjs-slp';
import * as Bitcore from 'bitcore-lib-cash';
import Axios from 'axios';
import { TransactionHelpers } from './transactionhelpers';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export class BitboxNetwork implements SlpValidator {
    BITBOX: BITBOX;
    slp: Slp;
    validator?: SlpValidator;
    txnHelpers: TransactionHelpers;
    logger: logger = { log: (s: string) => null }

    constructor(BITBOX: BITBOX, validator?: SlpValidator | SlpProxyValidator, logger?: logger) {
        if(!BITBOX)
            throw Error("Must provide BITBOX instance to class constructor.")
        if(logger)
            this.logger = logger;
        if(validator)
            this.validator = validator;
        this.BITBOX = BITBOX;
        this.slp = new Slp(BITBOX);
        this.txnHelpers = new TransactionHelpers(this.slp);
    }
    
    async getTokenInformation(txid: string, decimalConversion=false): Promise<SlpTransactionDetails|any> {
        let res: string[];
        try {
            res = <string[]|any>await this.BITBOX.RawTransactions.getRawTransaction([txid]);
        } catch (e) {
            throw Error(e.error)
        }
        
        if(!Array.isArray(res) || res.length !== 1)
            throw Error("BITBOX response error for 'RawTransactions.getRawTransaction'");

        let txhex = res[0];
        let txn: Bitcore.Transaction = new Bitcore.Transaction(txhex)

        let slpMsg = this.slp.parseSlpOutputScript(txn.outputs[0]._scriptBuffer);
        if(slpMsg.transactionType === SlpTransactionType.GENESIS) {
            slpMsg.tokenIdHex = txid;
            if(decimalConversion)
                slpMsg.genesisOrMintQuantity = slpMsg.genesisOrMintQuantity!.dividedBy(10**slpMsg.decimals)
        } else {
            if(decimalConversion)
                slpMsg.sendOutputs!.map(o => o.dividedBy(10**slpMsg.decimals))
        }
        return slpMsg;
    }

    // WARNING: this method is limited to 60 transactions per minute
    async getTransactionDetails(txid: string, decimalConversion=false) {
        let txn: any = (<TxnDetailsResult[]>await this.BITBOX.Transaction.details([ txid ]))[0];
        // add slp address format to transaction details
        txn.vin.forEach((input: any) => { 
            try { input.slpAddress = Utils.toSlpAddress(input.legacyAddress); } catch(_){}});
        txn.vout.forEach((output: any) => { 
            try { output.scriptPubKey.slpAddrs = [ Utils.toSlpAddress(output.scriptPubKey.cashAddrs[0]) ] } catch(_){}});

        // add token information to transaction details
        txn.tokenInfo = await this.getTokenInformation(txid, decimalConversion);
        txn.tokenIsValid = this.validator ? await this.validator.isValidSlpTxid(txid, null, this.logger) : await this.isValidSlpTxid(txid);
        return txn;
    }

    async getUtxos(address: string) {
        // must be a cash or legacy addr
        let res: AddressUtxoResult;
        if(!bchaddr.isCashAddress(address) && !bchaddr.isLegacyAddress(address)) 
            throw new Error("Not an a valid address format, must be cashAddr or Legacy address format.");
        res = (<AddressUtxoResult[]>await this.BITBOX.Address.utxo([address]))[0];
        return res;
    }

    async getAllSlpBalancesAndUtxos(address: string|string[]) {
        if(typeof address === "string") {
            address = bchaddr.toCashAddress(address);
            let result = await this.getUtxoWithTxDetails(address);
            return await this.processUtxosForSlp(result);
        }
        address = address.map(a => bchaddr.toCashAddress(a));
        let results: { address: string, result: SlpBalancesResult }[] = []
        for(let i = 0; i < address.length; i++) {
            let utxos = await this.getUtxoWithTxDetails(address[i]);
            results.push({ address: Utils.toSlpAddress(address[i]), result: await this.processUtxosForSlp(utxos) });
        }
        return results;
    }

    // Sent SLP tokens to a single output address with change handled (Warning: Sweeps all BCH/SLP UTXOs for the funding address)
    async simpleTokenSend(tokenId: string, sendAmounts: BigNumber|BigNumber[], inputUtxos: SlpAddressUtxoResult[], tokenReceiverAddresses: string|string[], changeReceiverAddress: string, requiredNonTokenOutputs: { satoshis: number, receiverAddress: string }[] = []) {  
        let txHex = this.txnHelpers.simpleTokenSend(tokenId, sendAmounts, inputUtxos, tokenReceiverAddresses, changeReceiverAddress, requiredNonTokenOutputs);
        return await this.sendTx(txHex);
    }

    async simpleBchSend(sendAmounts: BigNumber|BigNumber[], inputUtxos: SlpAddressUtxoResult[], bchReceiverAddresses: string|string[], changeReceiverAddress: string) {
        let genesisTxHex = this.txnHelpers.simpleBchSend(sendAmounts, inputUtxos, bchReceiverAddresses, changeReceiverAddress);
        return await this.sendTx(genesisTxHex);
    }

    async simpleNFT1Genesis(tokenName: string, tokenTicker: string, parentTokenIdHex: string, tokenReceiverAddress: string, bchChangeReceiverAddress: string, inputUtxos: SlpAddressUtxoResult[]) {
        let genesisTxHex = this.txnHelpers.simpleNFT1Genesis(tokenName, tokenTicker, parentTokenIdHex, tokenReceiverAddress, bchChangeReceiverAddress, inputUtxos);
        return await this.sendTx(genesisTxHex);
    }

    // Sent SLP tokens to a single output address with change handled (Warning: Sweeps all BCH/SLP UTXOs for the funding address)
    async simpleTokenMint(tokenId: string, mintAmount: BigNumber, inputUtxos: SlpAddressUtxoResult[], tokenReceiverAddress: string, batonReceiverAddress: string, changeReceiverAddress: string) {  
        let txHex = this.txnHelpers.simpleTokenMint(tokenId, mintAmount, inputUtxos, tokenReceiverAddress, batonReceiverAddress, changeReceiverAddress);
        return await this.sendTx(txHex);
    }

    // Burn a precise quantity of SLP tokens with remaining tokens (change) sent to a single output address (Warning: Sweeps all BCH/SLP UTXOs for the funding address)
    async simpleTokenBurn(tokenId: string, burnAmount: BigNumber, inputUtxos: SlpAddressUtxoResult[], changeReceiverAddress: string) {      
        let txHex = this.txnHelpers.simpleTokenBurn(tokenId, burnAmount, inputUtxos, changeReceiverAddress);
        return await this.sendTx(txHex);
    }

    async getUtxoWithRetry(address: string, retries = 40) {
		let result: AddressUtxoResult | undefined;
		let count = 0;
		while(result === undefined){
			result = await this.getUtxos(address)
			count++;
			if(count > retries)
				throw new Error("this.BITBOX.Address.utxo endpoint experienced a problem");
			await sleep(250);
		}
		return result;
    }

    async getUtxoWithTxDetails(address: string) {
        let utxos = Utils.mapToSlpAddressUtxoResultArray(await this.getUtxoWithRetry(address));
        let txIds = utxos.map((i: { txid: string; }) => i.txid)    
        if(txIds.length === 0)
            return [];
        // Split txIds into chunks of 20 (BitBox limit), run the detail queries in parallel
        let txDetails: any[] = (await Promise.all(_.chunk(txIds, 20).map((txids: any[]) => {
            return this.getTransactionDetailsWithRetry([...new Set(txids)]);
        })));
        // concat the chunked arrays
        txDetails = <TxnDetailsResult[]>[].concat(...txDetails);
        utxos = utxos.map((i: SlpAddressUtxoResult) => { i.tx = txDetails.find((d: TxnDetailsResult) => d.txid === i.txid ); return i;})
        return utxos;
    }
    
    async getTransactionDetailsWithRetry(txids: string[], retries = 40) {
        let result!: TxnDetailsResult[];
        let count = 0;
        while(result === undefined){
            result = <TxnDetailsResult[]>await this.BITBOX.Transaction.details(txids);
            if(result)
                return result;
            count++;
            if(count > retries)
                throw new Error("this.BITBOX.Address.details endpoint experienced a problem");
            await sleep(250);
        }
    }

	async getAddressDetailsWithRetry(address: string, retries = 40) {
        // must be a cash or legacy addr
        if(!bchaddr.isCashAddress(address) && !bchaddr.isLegacyAddress(address)) 
            throw new Error("Not an a valid address format, must be cashAddr or Legacy address format.");
		let result: AddressDetailsResult[] | undefined;
		let count = 0;
		while(result === undefined){
            result = <AddressDetailsResult[]>await this.BITBOX.Address.details([address]);
            if(result)
                return result;
			count++;
			if(count > retries)
				throw new Error("this.BITBOX.Address.details endpoint experienced a problem");
			await sleep(250);
		}
	}

    async sendTx(hex: string): Promise<string> {
        let res = await this.BITBOX.RawTransactions.sendRawTransaction([ hex ]as any);
        //console.log(res);
        if(typeof res === 'object') {
            return (<string[]>res)[0];
        }
        return res;
    }

    async monitorForPayment(paymentAddress: string, fee: number, onPaymentCB: Function) {
        let utxo: AddressUtxoResult | undefined;
        // must be a cash or legacy addr
        if(!bchaddr.isCashAddress(paymentAddress) && !bchaddr.isLegacyAddress(paymentAddress)) 
            throw new Error("Not an a valid address format, must be cashAddr or Legacy address format.");
        while (true) {
            try {
                utxo = await this.getUtxos(paymentAddress);
                if (utxo)
                    if(utxo.utxos[0].satoshis >= fee)
                        break
            } catch (ex) {
                console.log(ex)
            }
            await sleep(2000)
        }
        onPaymentCB()
    }


    async getRawTransactions(txids: string[]): Promise<string[]> {
        if(this.validator)
            return await this.validator.getRawTransactions(txids);
        return <any[]>await this.BITBOX.RawTransactions.getRawTransaction(txids);
    }

    async processUtxosForSlp(utxos: SlpAddressUtxoResult[]) {
        if(this.validator)
            return await this.slp.processUtxosForSlpAbstract(utxos, this.validator);
        return await this.slp.processUtxosForSlpAbstract(utxos, this);
    }

    async isValidSlpTxid(txid: string): Promise<boolean> {
        if(this.validator)
            return await this.validator.isValidSlpTxid(txid, undefined, this.logger);
        // WARNING: the following method is limited to 60 transactions per minute
        let validatorUrl = this.setRemoteValidatorUrl();
        this.logger.log("SLPJS Validating (remote: " + validatorUrl + "): " + txid);
        const result = await Axios({
            method: "post",
            url: validatorUrl,
            data: {
                txids: [ txid ]
            }
        })
        let res = false;
        if (result && result.data)
           res = (<{ txid: string, valid: boolean }[]>result.data).filter(i => i.valid).length > 0 ? true : false;
        this.logger.log("SLPJS Validator Result: " + res + " (remote: " + validatorUrl + "): " + txid);
        return res;
    }

    async validateSlpTransactions(txids: string[]): Promise<string[]> {
        if(this.validator)
            return await this.validator.validateSlpTransactions(txids);
        let validatorUrl = this.setRemoteValidatorUrl();
        
        const promises = _.chunk(txids, 20).map(ids => Axios({
            method: "post",
            url: validatorUrl,
            data: {
                txids: ids
            }
        }))
        const results = await Axios.all(promises);
        let result = { data: [] };
        results.forEach(res => {
            if (res.data)
                result.data = result.data.concat(res.data);
        });
        if (result && result.data)
            return (<{ txid: string, valid: boolean }[]>result.data).filter(i => i.valid).map(i => { return i.txid });
        return []
    }

    private setRemoteValidatorUrl() {
        let validatorUrl = this.BITBOX.restURL.replace('v1', 'v2');
        validatorUrl = validatorUrl.concat('/slp/validateTxid');
        validatorUrl = validatorUrl.replace('//slp', '/slp');
        return validatorUrl;
    }
}