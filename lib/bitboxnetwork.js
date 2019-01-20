"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const bignumber_js_1 = require("bignumber.js");
const lodash_1 = require("lodash");
const bchaddrjs_1 = require("bchaddrjs");
const slp_1 = require("./slp");
const proxyvalidation_1 = require("./proxyvalidation");
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
class BitboxNetwork {
    constructor(BITBOX, proxyUrl = 'https://validate.simpleledger.info') {
        this.BITBOX = BITBOX;
        this.slp = new slp_1.Slp();
        this.validator = new proxyvalidation_1.ProxyValidation(proxyUrl);
    }
    getUtxo(address) {
        return __awaiter(this, void 0, void 0, function* () {
            // must be a cash or legacy addr
            if (!bchaddrjs_1.default.isCashAddress(address) && !bchaddrjs_1.default.isLegacyAddress(address))
                throw new Error("Not an a valid address format, must be cashAddr or Legacy address format.");
            let res = yield this.BITBOX.Address.utxo(address);
            return res;
        });
    }
    getAllTokenBalancesFromUtxos(utxos) {
        return __awaiter(this, void 0, void 0, function* () {
            // try to parse out SLP object from SEND or GENESIS txn type
            for (let txOut of utxos) {
                try {
                    txOut.slp = this.slp.decodeTxOut(txOut);
                }
                catch (e) {
                    if (e.message === "Possible mint baton") {
                        txOut.baton = true;
                    }
                }
            }
            // getcset of VALID SLP txn ids
            let validSLPTx = yield this.validator.validateTransactions([
                ...new Set(utxos.filter(txOut => {
                    if (txOut.slp == undefined) {
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
                if ("slp" in txOut && txOut.txid in validSLPTx) {
                    if (!(txOut.slp.token in bals)) {
                        bals[txOut.slp.token] = new bignumber_js_1.default(0);
                    }
                    bals[txOut.slp.token] = bals[txOut.slp.token].plus(txOut.slp.quantity);
                    bals.satoshis_locked_in_token += txOut.satoshis;
                }
                else if (txOut.baton === true) {
                    bals.satoshis_locked_in_minting_baton += txOut.satoshis;
                }
                else {
                    bals.satoshis_available += txOut.satoshis;
                }
            }
            return bals;
        });
    }
    getAllTokenBalances(address) {
        return __awaiter(this, void 0, void 0, function* () {
            // convert address to cashAddr if needed
            address = bchaddrjs_1.default.toCashAddress(address);
            let UTXOset = yield this.getUtxoWithTxDetails(address);
            return yield this.getAllTokenBalancesFromUtxos(UTXOset);
        });
    }
    // fundingAddress and tokenReceiverAddress must be in SLP format.
    sendToken(tokenId, sendAmount, fundingAddress, fundingWif, tokenReceiverAddress, changeReceiverAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            // convert address to cashAddr from SLP format.
            let fundingAddress_cashfmt = bchaddrjs_1.default.toCashAddress(fundingAddress);
            // 1) Get all utxos for our address and filter out UTXOs for other tokens
            let inputUtxoSet = [];
            let utxoSet = yield this.getUtxoWithTxDetails(fundingAddress_cashfmt);
            for (let utxo of utxoSet) {
                try {
                    utxo.slp = this.slp.decodeTxOut(utxo);
                    if (utxo.slp.token != tokenId)
                        continue;
                }
                catch (_) { }
                // sweeping inputs is easiest way to manage coin selection
                inputUtxoSet.push(utxo);
            }
            // find the valid SLP tokens and compute the valid input balance.
            let validSLPTx = yield this.validator.validateTransactions([
                ...new Set(utxoSet.filter(txOut => {
                    if (txOut.slp == undefined) {
                        return false;
                    }
                    if (txOut.slp.token != tokenId) {
                        return false;
                    }
                    return true;
                }).map(txOut => txOut.txid))
            ]);
            let validTokenQuantity = new bignumber_js_1.default(0);
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
            if (tokenChangeAmount.isGreaterThan(new bignumber_js_1.default(0))) {
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
            }
            else {
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
            return yield this.sendTx(txHex);
        });
    }
    getUtxoWithRetry(address, retries = 40) {
        return __awaiter(this, void 0, void 0, function* () {
            let result;
            let count = 0;
            while (result == undefined) {
                result = yield this.getUtxo(address);
                count++;
                if (count > retries)
                    throw new Error("this.BITBOX.Address.utxo endpoint experienced a problem");
                yield sleep(250);
            }
            return result;
        });
    }
    getUtxoWithTxDetails(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const set = yield this.getUtxoWithRetry(address)[0];
            let txIds = set.map(i => i.txid);
            if (txIds.length === 0) {
                return [];
            }
            // Split txIds into chunks of 20 (BitBox limit), run the detail queries in parallel
            let txDetails = yield Promise.all(lodash_1.default.chunk(txIds, 20).map(txIdchunk => {
                return this.getTransactionDetailsWithRetry(txIdchunk);
            }));
            // concat the chunked arrays
            txDetails = [].concat(...txDetails);
            for (let i = 0; i < set.length; i++) {
                set[i].tx = txDetails[i];
            }
            return set;
        });
    }
    getTransactionDetailsWithRetry(txid, retries = 40) {
        return __awaiter(this, void 0, void 0, function* () {
            let result;
            let count = 0;
            while (result == undefined) {
                result = yield this.BITBOX.Transaction.details(txid);
                count++;
                if (count > retries)
                    throw new Error("this.BITBOX.Address.details endpoint experienced a problem");
                yield sleep(250);
            }
            return result;
        });
    }
    getAddressDetailsWithRetry(address, retries = 40) {
        return __awaiter(this, void 0, void 0, function* () {
            // must be a cash or legacy addr
            if (!bchaddrjs_1.default.isCashAddress(address) && !bchaddrjs_1.default.isLegacyAddress(address))
                throw new Error("Not an a valid address format, must be cashAddr or Legacy address format.");
            let result;
            let count = 0;
            while (result == undefined) {
                result = yield this.BITBOX.Address.details(address);
                count++;
                if (count > retries)
                    throw new Error("this.BITBOX.Address.details endpoint experienced a problem");
                yield sleep(250);
            }
            return result;
        });
    }
    sendTx(hex) {
        return __awaiter(this, void 0, void 0, function* () {
            let res = yield this.BITBOX.RawTransactions.sendRawTransaction(hex);
            console.log(res);
            return res;
        });
    }
    monitorForPayment(paymentAddress, fee, onPaymentCB) {
        return __awaiter(this, void 0, void 0, function* () {
            // must be a cash or legacy addr
            if (!bchaddrjs_1.default.isCashAddress(paymentAddress) && !bchaddrjs_1.default.isLegacyAddress(paymentAddress))
                throw new Error("Not an a valid address format, must be cashAddr or Legacy address format.");
            while (true) {
                try {
                    let utxo = (yield this.getUtxo(paymentAddress))[0][0];
                    if (utxo && utxo.satoshis >= fee) {
                        break;
                    }
                }
                catch (ex) {
                    console.log(ex);
                }
                yield sleep(5000);
            }
            onPaymentCB();
        });
    }
}
exports.BitboxNetwork = BitboxNetwork;
