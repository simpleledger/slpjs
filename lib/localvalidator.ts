import { SlpTransactionType, SlpTransactionDetails, logger } from '../index';
import { SlpValidator, Slp } from './slp';

import { BITBOX } from 'bitbox-sdk';
import * as Bitcore from 'bitcore-lib-cash';
import BigNumber from 'bignumber.js';

export interface Validation { validity: boolean|null; parents: Parent[], details: SlpTransactionDetails|null, invalidReason: string|null } 
export type GetRawTransactionsAsync = (txid: string[]) => Promise<string[]>;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

interface Parent {
    txid: string;
    vout: number;
    versionType: number;
    valid: boolean|null;
    inputQty: BigNumber|null;
}

export class LocalValidator implements SlpValidator {
    BITBOX: BITBOX;
    cachedRawTransactions: { [txid: string]: string }
    cachedValidations: { [txid: string]: Validation }
    getRawTransactions: GetRawTransactionsAsync;
    slp: Slp;
    logger: logger = { log: (s: string)=>null }

    constructor(BITBOX: BITBOX, getRawTransactions: GetRawTransactionsAsync, logger?: logger) {
        if(!BITBOX)
            throw Error("Must provide BITBOX instance to class constructor.")
        if(!getRawTransactions)
            throw Error("Must provide method getRawTransactions to class constructor.")
        if(logger)
            this.logger = logger;
        this.BITBOX = BITBOX;
        this.getRawTransactions = getRawTransactions;
        this.slp = new Slp(BITBOX);
        this.cachedValidations = {};
        this.cachedRawTransactions = {};
    }

    addValidationFromStore(hex: string, isValid: boolean) {
        let id = (<Buffer>this.BITBOX.Crypto.sha256(this.BITBOX.Crypto.sha256(Buffer.from(hex, 'hex'))).reverse()).toString('hex');
        if(!this.cachedValidations[id])
            this.cachedValidations[id] = { validity: isValid, parents: [], details: null, invalidReason: null }
        if(!this.cachedRawTransactions[id])
            this.cachedRawTransactions[id] = hex;
    }
    
    async waitForCurrentValidationProcessing(txid: string) {
        // TODO: Add some timeout?
        let cached: Validation = this.cachedValidations[txid];

        while(true) {
            if(typeof cached.validity === 'boolean')
                break
            await sleep(10);
        }
    }

    async waitForTransactionPreProcessing(txid: string){
        // TODO: Add some timeout?
        while(true) {
            if(this.cachedRawTransactions[txid] && (this.cachedValidations[txid].details || typeof this.cachedValidations.validity === 'boolean'))
                break
            await sleep(10);
        }
        //await sleep(100); // short wait to make sure parent's properties gets set first.
        return
    }

    async retrieveRawTransaction(txid: string) {
        if(this.cachedRawTransactions[txid])
            return this.cachedRawTransactions[txid];
        this.cachedRawTransactions[txid] = (await this.getRawTransactions([txid]))[0]
        if(this.cachedRawTransactions[txid]) {
            let re = /^([A-Fa-f0-9]{2}){60,}$/;
            if(!re.test(this.cachedRawTransactions[txid]))
                throw Error("Transaction data not provided (regex failed).")
            return this.cachedRawTransactions[txid];
        }
        throw Error("Transaction data not provided (null or undefined).")
    }

    async isValidSlpTxid(txid: string, tokenIdFilter?: string): Promise<boolean> {
        this.logger.log("SLPJS Validating: " + txid);
        let valid = await this._isValidSlpTxid(txid, tokenIdFilter);
        this.logger.log("SLPJS Result: " + valid + " (" + txid + ")");
        if(!valid && this.cachedValidations[txid].invalidReason)
            this.logger.log("SLPJS Invalid Reason: " + this.cachedValidations[txid].invalidReason);
        else if(!valid)
            this.logger.log("SLPJS Invalid Reason: unknown (result is user supplied)")
        return valid;
    }

    async _isValidSlpTxid(txid: string, tokenIdFilter?: string): Promise<boolean> {
        if(!this.cachedValidations[txid]) {
            this.cachedValidations[txid] = { validity: null, parents: [], details: null, invalidReason: null }
            await this.retrieveRawTransaction(txid);
        }
        else if(typeof this.cachedValidations[txid].validity === 'boolean')
            return this.cachedValidations[txid].validity!;

        // Check to see how we should proceed based on the validation-cache state
        if(!this.cachedRawTransactions[txid])
            await this.waitForTransactionPreProcessing(txid);
        if(this.cachedValidations[txid].details)
            await this.waitForCurrentValidationProcessing(txid);

        // Check SLP message validity
        let txn: Bitcore.Transaction = new Bitcore.Transaction(this.cachedRawTransactions[txid])
        let slpmsg: SlpTransactionDetails;
        try {
            slpmsg = this.cachedValidations[txid].details = this.slp.parseSlpOutputScript(txn.outputs[0]._scriptBuffer)
            if(slpmsg.transactionType === SlpTransactionType.GENESIS)
                slpmsg.tokenIdHex = txid;
        } catch(e) {
            this.cachedValidations[txid].invalidReason = "SLP OP_RETURN parsing error (" + e.message + ")."
            return this.cachedValidations[txid].validity = false;
        }

        // Check for tokenId filter
        if(tokenIdFilter && slpmsg.tokenIdHex !== tokenIdFilter) {
            this.cachedValidations[txid].invalidReason = "Only tokenId " + tokenIdFilter + " was considered by validator.";
            return this.cachedValidations[txid].validity = false;
        }

        // Check DAG validity
        if(slpmsg.transactionType === SlpTransactionType.GENESIS) {
            return this.cachedValidations[txid].validity = true;
        } 
        else if (slpmsg.transactionType === SlpTransactionType.MINT) {
            for(let i = 0; i < txn.inputs.length; i++) {
                let input_txid = txn.inputs[i].prevTxId.toString('hex')
                let input_txhex = await this.retrieveRawTransaction(input_txid)
                let input_tx: Bitcore.Transaction = new Bitcore.Transaction(input_txhex);
                try {
                    let input_slpmsg = this.slp.parseSlpOutputScript(input_tx.outputs[0]._scriptBuffer)
                    if(input_slpmsg.transactionType === SlpTransactionType.GENESIS)
                        input_slpmsg.tokenIdHex = input_txid;
                    if(input_slpmsg.tokenIdHex === slpmsg.tokenIdHex) {
                        if(input_slpmsg.transactionType === SlpTransactionType.GENESIS || input_slpmsg.transactionType === SlpTransactionType.MINT) {
                            if(txn.inputs[i].outputIndex === input_slpmsg.batonVout) {
                                this.cachedValidations[txid].parents.push({ 
                                    txid: txn.inputs[i].prevTxId.toString('hex'), 
                                    vout: txn.inputs[i].outputIndex, 
                                    versionType: input_slpmsg.versionType,
                                    valid: null,
                                    inputQty: null 
                                })
                            }
                        }
                    }
                } catch(_) {}
            }
            if(this.cachedValidations[txid].parents.length !== 1) {
                this.cachedValidations[txid].invalidReason = "MINT transaction must have 1 valid baton parent."
                return this.cachedValidations[txid].validity = false;
            }
        }
        else if(slpmsg.transactionType === SlpTransactionType.SEND) {
            let tokenOutQty = slpmsg.sendOutputs!.reduce((t,v)=>{ return t.plus(v) }, new BigNumber(0))
            let tokenInQty = new BigNumber(0);
            for(let i = 0; i < txn.inputs.length; i++) {
                let input_txid = txn.inputs[i].prevTxId.toString('hex')
                let input_txhex = await this.retrieveRawTransaction(input_txid)
                let input_tx: Bitcore.Transaction = new Bitcore.Transaction(input_txhex);
                try {
                    let input_slpmsg = this.slp.parseSlpOutputScript(input_tx.outputs[0]._scriptBuffer)
                    if(input_slpmsg.transactionType === SlpTransactionType.GENESIS)
                        input_slpmsg.tokenIdHex = input_txid;
                    if(input_slpmsg.tokenIdHex === slpmsg.tokenIdHex) {
                        if(input_slpmsg.transactionType === SlpTransactionType.SEND) {
                            if(txn.inputs[i].outputIndex <= input_slpmsg.sendOutputs!.length-1) {
                                tokenInQty = tokenInQty.plus(input_slpmsg.sendOutputs![txn.inputs[i].outputIndex])
                                this.cachedValidations[txid].parents.push({ 
                                    txid: txn.inputs[i].prevTxId.toString('hex'), 
                                    vout: txn.inputs[i].outputIndex, 
                                    versionType: input_slpmsg.versionType, 
                                    valid: null, 
                                    inputQty: input_slpmsg.sendOutputs![txn.inputs[i].outputIndex] 
                                })
                            }
                        }
                        else if(input_slpmsg.transactionType === SlpTransactionType.GENESIS || input_slpmsg.transactionType === SlpTransactionType.MINT) {
                            if(txn.inputs[i].outputIndex === 1) {
                                tokenInQty = tokenInQty.plus(input_slpmsg.genesisOrMintQuantity!)
                                this.cachedValidations[txid].parents.push({ 
                                    txid: txn.inputs[i].prevTxId.toString('hex'), 
                                    vout: txn.inputs[i].outputIndex, 
                                    versionType: input_slpmsg.versionType, 
                                    valid: null, 
                                    inputQty: input_slpmsg.genesisOrMintQuantity 
                                })
                            }
                        }
                    }
                } catch(_) {}
            }

            // Check token inputs are greater than token outputs (includes valid and invalid inputs)
            if(tokenOutQty.isGreaterThan(tokenInQty)) {
                this.cachedValidations[txid].invalidReason = "Token outputs are greater than possible token inputs."
                return this.cachedValidations[txid].validity = false;
            }
        }

        // Set validity validation-cache for parents, and handle MINT condition with no valid input
        let parentTxids = [...new Set(this.cachedValidations[txid].parents.map(p => p.txid))];
        for(let i = 0; i < parentTxids.length; i++) {
            let valid = await this.isValidSlpTxid(parentTxids[i])
            this.cachedValidations[txid].parents.filter(p => p.txid === parentTxids[i]).map(p => p.valid = valid);
            if(this.cachedValidations[txid].details!.transactionType === SlpTransactionType.MINT && !valid) {
                this.cachedValidations[txid].invalidReason = "MINT transaction with invalid baton parent."
                return this.cachedValidations[txid].validity = false;
            }
        }

        // Check valid inputs are greater than token outputs
        if(this.cachedValidations[txid].details!.transactionType === SlpTransactionType.SEND) {
            let validInputQty = this.cachedValidations[txid].parents.reduce((t, v) => { return v.valid ? t.plus(v.inputQty!) : t }, new BigNumber(0));
            let tokenOutQty = slpmsg.sendOutputs!.reduce((t,v)=>{ return t.plus(v) }, new BigNumber(0))
            if(tokenOutQty.isGreaterThan(validInputQty)) {
                this.cachedValidations[txid].invalidReason = "Token outputs are greater than valid token inputs."
                return this.cachedValidations[txid].validity = false;
            }
        }

        // Check versionType is not different from valid parents
        if(this.cachedValidations[txid].parents.filter(p => p.valid).length > 0) {
            let validVersionType = this.cachedValidations[txid].parents.find(p => p.valid!)!.versionType;
            if(this.cachedValidations[txid].details!.versionType !== validVersionType) {
                this.cachedValidations[txid].invalidReason = "SLP version/type mismatch from valid parent."
                return this.cachedValidations[txid].validity = false;
            }
        }

        return this.cachedValidations[txid].validity = true;
    }

    async validateSlpTransactions(txids: string[]): Promise<string[]> {
        let res = [];
        for (let i = 0; i < txids.length; i++) {
            res.push((await this.isValidSlpTxid(txids[i])) ? txids[i] : '')
        }
        return res.filter((id: string) => id.length > 0);
    }
}