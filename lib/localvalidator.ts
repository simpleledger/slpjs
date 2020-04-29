import { logger, SlpTransactionDetails, SlpTransactionType } from "../index";
import { Slp, SlpValidator } from "./slp";

import BigNumber from "bignumber.js";
import { BITBOX } from "bitbox-sdk";
import * as Bitcore from "bitcore-lib-cash";

import { Crypto } from "./crypto";

export interface Validation { validity: boolean|null; parents: Parent[]; details: SlpTransactionDetails|null; invalidReason: string|null; waiting: boolean; }
export type GetRawTransactionsAsync = (txid: string[]) => Promise<string[]>;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface Parent {
    txid: string;
    vout: number;
    versionType: number;
    valid: boolean|null;
    inputQty: BigNumber|null;
}

export class LocalValidator implements SlpValidator {
    public BITBOX: BITBOX;
    public cachedRawTransactions: { [txid: string]: string };
    public cachedValidations: { [txid: string]: Validation };
    public getRawTransactions: GetRawTransactionsAsync;
    public slp: Slp;
    public logger: logger = { log: (s: string) => null };

    constructor(BITBOX: BITBOX, getRawTransactions: GetRawTransactionsAsync, logger?: logger) {
        if (!BITBOX) {
            throw Error("Must provide BITBOX instance to class constructor.");
        }
        if (!getRawTransactions) {
            throw Error("Must provide method getRawTransactions to class constructor.");
        }
        if (logger) {
            this.logger = logger;
        }
        this.BITBOX = BITBOX;
        this.getRawTransactions = getRawTransactions;
        this.slp = new Slp(BITBOX);
        this.cachedValidations = {};
        this.cachedRawTransactions = {};
    }

    public addValidationFromStore(hex: string, isValid: boolean) {
        const id = Crypto.txid(Buffer.from(hex, "hex")).toString("hex");
        if (!this.cachedValidations[id]) {
            this.cachedValidations[id] = { validity: isValid, parents: [], details: null, invalidReason: null, waiting: false };
        }
        if (!this.cachedRawTransactions[id]) {
            this.cachedRawTransactions[id] = hex;
        }
    }

    public async waitForCurrentValidationProcessing(txid: string) {
        const cached: Validation = this.cachedValidations[txid];

        while (true) {
            if (typeof cached.validity === "boolean") {
                cached.waiting = false;
                break;
            }
            await sleep(10);
        }
    }

    public async waitForTransactionDownloadToComplete(txid: string){
        while (true) {
            if (this.cachedRawTransactions[txid] && this.cachedRawTransactions[txid] !== "waiting") {
                break;
            }
            await sleep(10);
        }
    }

    public async retrieveRawTransaction(txid: string) {
        const checkTxnRegex = (txn: string) => {
            const re = /^([A-Fa-f0-9]{2}){61,}$/;
            if (!re.test(txn)) {
                throw Error(`Regex failed for retrieved transaction, got: ${txn}`);
            }
        };
        if (!this.cachedRawTransactions[txid]) {
            this.cachedRawTransactions[txid] = "waiting";
            const txns = await this.getRawTransactions([txid]);
            if (!txns || txns.length === 0 || typeof txns[0] !== "string") {
                throw Error(`Response error in getRawTransactions, got: ${txns}`);
            }
            checkTxnRegex(txns[0]);
            this.cachedRawTransactions[txid] = txns[0];
            return txns[0];
        } else {
            checkTxnRegex(this.cachedRawTransactions[txid]);
            return this.cachedRawTransactions[txid];
        }
    }

    public async isValidSlpTxid(txid: string, tokenIdFilter?: string, tokenTypeFilter?: number): Promise<boolean> {
        this.logger.log("SLPJS Validating: " + txid);
        const valid = await this._isValidSlpTxid(txid, tokenIdFilter, tokenTypeFilter);
        this.logger.log("SLPJS Result: " + valid + " (" + txid + ")");
        if (!valid && this.cachedValidations[txid].invalidReason) {
            this.logger.log("SLPJS Invalid Reason: " + this.cachedValidations[txid].invalidReason);
        } else if (!valid) {
            this.logger.log("SLPJS Invalid Reason: unknown (result is user supplied)");
        }
        return valid;
    }

    //
    // This method uses recursion to do a Depth-First-Search with the node result being
    // computed in Postorder Traversal (left/right/root) order.  A validation cache
    // is used to keep track of the results for nodes that have already been evaluated.
    //
    // Each call to this method evaluates node validity with respect to
    // its parent node(s), so it walks backwards until the
    // validation cache provides a result or the GENESIS node is evaluated.
    // Root nodes await the validation result of their upstream parent.
    //
    // In the case of NFT1 the search continues to the group/parent NFT DAG after the Genesis
    // of the NFT child is discovered.
    //
    public async _isValidSlpTxid(txid: string, tokenIdFilter?: string, tokenTypeFilter?: number): Promise<boolean> {
        // Check to see if this txn has been processed by looking at shared cache, if doesn't exist then download txn.
        if (!this.cachedValidations[txid]) {
            this.cachedValidations[txid] = {
                validity: null,
                parents: [],
                details: null,
                invalidReason: null,
                waiting: false,
            };
            await this.retrieveRawTransaction(txid);
        }
        // Otherwise, we can use the cached result as long as a special filter isn't being applied.
        else if (typeof this.cachedValidations[txid].validity === "boolean") {
            return this.cachedValidations[txid].validity!;
        }

        //
        // Handle the case where neither branch of the previous if/else statement was
        // executed and the raw transaction has never been downloaded.
        //
        // Also handle case where a 2nd request of same txid comes in
        // during the download of a previous request.
        //
        if (!this.cachedRawTransactions[txid] || this.cachedRawTransactions[txid] === "waiting") {
            if (this.cachedRawTransactions[txid] !== "waiting") {
                this.retrieveRawTransaction(txid);
            }

            // Wait for previously a initiated download to completed
            await this.waitForTransactionDownloadToComplete(txid);
        }

        // Handle case where txid is already in the process of being validated from a previous call
        if (this.cachedValidations[txid].waiting) {
            await this.waitForCurrentValidationProcessing(txid);
            if (typeof this.cachedValidations[txid].validity === "boolean") {
                return this.cachedValidations[txid].validity!;
            }
        }

        this.cachedValidations[txid].waiting = true;

        // Check SLP message validity
        const txn: Bitcore.Transaction = new Bitcore.Transaction(this.cachedRawTransactions[txid]);
        let slpmsg: SlpTransactionDetails;
        try {
            slpmsg = this.cachedValidations[txid].details = this.slp.parseSlpOutputScript(txn.outputs[0]._scriptBuffer);
            if (slpmsg.transactionType === SlpTransactionType.GENESIS) {
                slpmsg.tokenIdHex = txid;
            }
        } catch (e) {
            this.cachedValidations[txid].validity = false;
            this.cachedValidations[txid].waiting = false;
            this.cachedValidations[txid].invalidReason = "SLP OP_RETURN parsing error (" + e.message + ").";
            return this.cachedValidations[txid].validity!;
        }

        // Check for tokenId filter
        if (tokenIdFilter && slpmsg.tokenIdHex !== tokenIdFilter) {
            this.cachedValidations[txid].waiting = false;
            this.cachedValidations[txid].invalidReason = "Validator was run with filter only considering tokenId " + tokenIdFilter + " as valid.";
            return false; // Don't save boolean result to cache incase cache is ever used without tokenIdFilter.
        } else {
            if (this.cachedValidations[txid].validity !== false) {
                this.cachedValidations[txid].invalidReason = null;
            }
        }

        // Check specified token type is being respected
        if (tokenTypeFilter && slpmsg.versionType !== tokenTypeFilter) {
            this.cachedValidations[txid].validity = null;
            this.cachedValidations[txid].waiting = false;
            this.cachedValidations[txid].invalidReason = "Validator was run with filter only considering token type: " + tokenTypeFilter + " as valid.";
            return false; // Don't save boolean result to cache incase cache is ever used with different token type.
        } else {
            if (this.cachedValidations[txid].validity !== false) {
                this.cachedValidations[txid].invalidReason = null;
            }
        }

        // Check DAG validity
        if (slpmsg.transactionType === SlpTransactionType.GENESIS) {
            // Check for NFT1 child (type 0x41)
            if (slpmsg.versionType === 0x41) {
                // An NFT1 parent should be provided at input index 0,
                // so we check this first before checking the whole parent DAG
                let input_txid = txn.inputs[0].prevTxId.toString("hex");
                let input_txhex = await this.retrieveRawTransaction(input_txid);
                let input_tx: Bitcore.Transaction = new Bitcore.Transaction(input_txhex);
                let input_slpmsg;
                try {
                    input_slpmsg = this.slp.parseSlpOutputScript(input_tx.outputs[0]._scriptBuffer);
                } catch (_) { }
                if (!input_slpmsg || input_slpmsg.versionType !== 0x81) {
                    this.cachedValidations[txid].validity = false;
                    this.cachedValidations[txid].waiting = false;
                    this.cachedValidations[txid].invalidReason = "NFT1 child GENESIS does not have a valid NFT1 parent input.";
                    return this.cachedValidations[txid].validity!;
                }
                // Check that the there is a burned output >0 in the parent txn SLP message
                if (input_slpmsg.transactionType === SlpTransactionType.SEND &&
                    (!input_slpmsg.sendOutputs![1].isGreaterThan(0)))
                {
                    this.cachedValidations[txid].validity = false;
                    this.cachedValidations[txid].waiting = false;
                    this.cachedValidations[txid].invalidReason = "NFT1 child's parent has SLP output that is not greater than zero.";
                    return this.cachedValidations[txid].validity!;
                } else if ((input_slpmsg.transactionType === SlpTransactionType.GENESIS ||
                            input_slpmsg.transactionType === SlpTransactionType.MINT) &&
                            !input_slpmsg.genesisOrMintQuantity!.isGreaterThan(0))
                {
                    this.cachedValidations[txid].validity = false;
                    this.cachedValidations[txid].waiting = false;
                    this.cachedValidations[txid].invalidReason = "NFT1 child's parent has SLP output that is not greater than zero.";
                    return this.cachedValidations[txid].validity!;
                }
                // Continue to check the NFT1 parent DAG
                let nft_parent_dag_validity = await this.isValidSlpTxid(input_txid, undefined, 0x81);
                this.cachedValidations[txid].validity = nft_parent_dag_validity;
                this.cachedValidations[txid].waiting = false;
                if (!nft_parent_dag_validity) {
                    this.cachedValidations[txid].invalidReason = "NFT1 child GENESIS does not have valid parent DAG.";
                }
                return this.cachedValidations[txid].validity!;
            }
            // All other supported token types (includes 0x01 and 0x81)
            // No need to check type here since op_return parser throws on other types.
            else {
                this.cachedValidations[txid].validity = true;
                this.cachedValidations[txid].waiting = false;
                return this.cachedValidations[txid].validity!;
            }
        }
        else if (slpmsg.transactionType === SlpTransactionType.MINT) {
            for (let i = 0; i < txn.inputs.length; i++) {
                let input_txid = txn.inputs[i].prevTxId.toString("hex");
                let input_txhex = await this.retrieveRawTransaction(input_txid);
                let input_tx: Bitcore.Transaction = new Bitcore.Transaction(input_txhex);
                try {
                    let input_slpmsg = this.slp.parseSlpOutputScript(input_tx.outputs[0]._scriptBuffer);
                    if (input_slpmsg.transactionType === SlpTransactionType.GENESIS) {
                        input_slpmsg.tokenIdHex = input_txid;
                    }
                    if (input_slpmsg.tokenIdHex === slpmsg.tokenIdHex) {
                        if (input_slpmsg.transactionType === SlpTransactionType.GENESIS || input_slpmsg.transactionType === SlpTransactionType.MINT) {
                            if (txn.inputs[i].outputIndex === input_slpmsg.batonVout) {
                                this.cachedValidations[txid].parents.push({
                                    txid: txn.inputs[i].prevTxId.toString("hex"),
                                    vout: txn.inputs[i].outputIndex!,
                                    versionType: input_slpmsg.versionType,
                                    valid: null,
                                    inputQty: null,
                                });
                            }
                        }
                    }
                } catch (_) {}
            }
            if (this.cachedValidations[txid].parents.length < 1) {
                this.cachedValidations[txid].validity = false;
                this.cachedValidations[txid].waiting = false;
                this.cachedValidations[txid].invalidReason = "MINT transaction must have at least 1 candidate baton parent input.";
                return this.cachedValidations[txid].validity!;
            }
        }
        else if (slpmsg.transactionType === SlpTransactionType.SEND) {
            const tokenOutQty = slpmsg.sendOutputs!.reduce((t, v) => { return t.plus(v); }, new BigNumber(0));
            let tokenInQty = new BigNumber(0);
            for (let i = 0; i < txn.inputs.length; i++) {
                let input_txid = txn.inputs[i].prevTxId.toString("hex");
                let input_txhex = await this.retrieveRawTransaction(input_txid);
                let input_tx: Bitcore.Transaction = new Bitcore.Transaction(input_txhex);
                try {
                    let input_slpmsg = this.slp.parseSlpOutputScript(input_tx.outputs[0]._scriptBuffer);
                    if (input_slpmsg.transactionType === SlpTransactionType.GENESIS) {
                        input_slpmsg.tokenIdHex = input_txid;
                    }
                    if (input_slpmsg.tokenIdHex === slpmsg.tokenIdHex) {
                        if (input_slpmsg.transactionType === SlpTransactionType.SEND) {
                            if (txn.inputs[i].outputIndex! <= input_slpmsg.sendOutputs!.length - 1) {
                                tokenInQty = tokenInQty.plus(input_slpmsg.sendOutputs![txn.inputs[i].outputIndex!]);
                                this.cachedValidations[txid].parents.push({
                                    txid: txn.inputs[i].prevTxId.toString("hex"),
                                    vout: txn.inputs[i].outputIndex!,
                                    versionType: input_slpmsg.versionType,
                                    valid: null,
                                    inputQty: input_slpmsg.sendOutputs![txn.inputs[i].outputIndex!]
                                });
                            }
                        }
                        else if (input_slpmsg.transactionType === SlpTransactionType.GENESIS || input_slpmsg.transactionType === SlpTransactionType.MINT) {
                            if (txn.inputs[i].outputIndex === 1) {
                                tokenInQty = tokenInQty.plus(input_slpmsg.genesisOrMintQuantity!);
                                this.cachedValidations[txid].parents.push({
                                    txid: txn.inputs[i].prevTxId.toString("hex"),
                                    vout: txn.inputs[i].outputIndex!,
                                    versionType: input_slpmsg.versionType,
                                    valid: null,
                                    inputQty: input_slpmsg.genesisOrMintQuantity
                                });
                            }
                        }
                    }
                } catch (_) {}
            }

            // Check token inputs are greater than token outputs (includes valid and invalid inputs)
            if (tokenOutQty.isGreaterThan(tokenInQty)) {
                this.cachedValidations[txid].validity = false;
                this.cachedValidations[txid].waiting = false;
                this.cachedValidations[txid].invalidReason = "Token outputs are greater than possible token inputs.";
                return this.cachedValidations[txid].validity!;
            }
        }

        // Set validity validation-cache for parents, and handle MINT condition with no valid input
        // we don't need to check proper token id since we only added parents with same ID in above steps.
        const parentTxids = [...new Set(this.cachedValidations[txid].parents.map(p => p.txid))];
        for (const id of parentTxids) {
            const valid = await this.isValidSlpTxid(id);
            this.cachedValidations[txid].parents.filter(p => p.txid === id).map(p => p.valid = valid);
        }

        // Check MINT for exactly 1 valid MINT baton
        if (this.cachedValidations[txid].details!.transactionType === SlpTransactionType.MINT) {
            if (this.cachedValidations[txid].parents.filter(p => p.valid && p.inputQty === null).length !== 1) {
                this.cachedValidations[txid].validity = false;
                this.cachedValidations[txid].waiting = false;
                this.cachedValidations[txid].invalidReason = "MINT transaction with invalid baton parent.";
                return this.cachedValidations[txid].validity!;
            }
        }

        // Check valid inputs are greater than token outputs
        if (this.cachedValidations[txid].details!.transactionType === SlpTransactionType.SEND) {
            const validInputQty = this.cachedValidations[txid].parents.reduce((t, v) => { return v.valid ? t.plus(v.inputQty!) : t; }, new BigNumber(0));
            const tokenOutQty = slpmsg.sendOutputs!.reduce((t, v) => { return t.plus(v); }, new BigNumber(0));
            if (tokenOutQty.isGreaterThan(validInputQty)) {
                this.cachedValidations[txid].validity = false;
                this.cachedValidations[txid].waiting = false;
                this.cachedValidations[txid].invalidReason = "Token outputs are greater than valid token inputs.";
                return this.cachedValidations[txid].validity!;
            }
        }

        // Check versionType is not different from valid parents
        if (this.cachedValidations[txid].parents.filter(p => p.valid).length > 0) {
            const validVersionType = this.cachedValidations[txid].parents.find(p => p.valid!)!.versionType;
            if (this.cachedValidations[txid].details!.versionType !== validVersionType) {
                this.cachedValidations[txid].validity = false;
                this.cachedValidations[txid].waiting = false;
                this.cachedValidations[txid].invalidReason = "SLP version/type mismatch from valid parent.";
                return this.cachedValidations[txid].validity!;
            }
        }
        this.cachedValidations[txid].validity = true;
        this.cachedValidations[txid].waiting = false;
        return this.cachedValidations[txid].validity!;
    }

    public async validateSlpTransactions(txids: string[]): Promise<string[]> {
        const res = [];
        for (let i = 0; i < txids.length; i++) {
            res.push((await this.isValidSlpTxid(txids[i])) ? txids[i] : "");
        }
        return res.filter((id: string) => id.length > 0);
    }
}