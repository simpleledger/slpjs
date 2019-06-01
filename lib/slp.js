"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../index");
var slptokentype1_1 = require("./slptokentype1");
var utils_1 = require("./utils");
var bchaddr = require("bchaddrjs-slp");
var bignumber_js_1 = require("bignumber.js");
var Slp = /** @class */ (function () {
    function Slp(bitbox) {
        if (!bitbox)
            throw Error("Must provide BITBOX instance to class constructor.");
        this.BITBOX = bitbox;
    }
    Object.defineProperty(Slp.prototype, "lokadIdHex", {
        get: function () { return "534c5000"; },
        enumerable: true,
        configurable: true
    });
    Slp.buildNFT1GenesisOpReturn = function (config, type) {
        if (type === void 0) { type = 0x01; }
        return slptokentype1_1.SlpTokenType1.buildNFT1GenesisOpReturn(config.ticker, config.name, config.parentTokenIdHex, config.parentInputIndex);
    };
    Slp.buildGenesisOpReturn = function (config, type) {
        if (type === void 0) { type = 0x01; }
        var hash;
        try {
            hash = config.hash.toString('hex');
        }
        catch (_) {
            hash = null;
        }
        return slptokentype1_1.SlpTokenType1.buildGenesisOpReturn(config.ticker, config.name, config.documentUri, hash, config.decimals, config.batonVout, config.initialQuantity);
    };
    Slp.buildMintOpReturn = function (config, type) {
        if (type === void 0) { type = 0x01; }
        return slptokentype1_1.SlpTokenType1.buildMintOpReturn(config.tokenIdHex, config.batonVout, config.mintQuantity);
    };
    Slp.buildSendOpReturn = function (config, type) {
        if (type === void 0) { type = 0x01; }
        return slptokentype1_1.SlpTokenType1.buildSendOpReturn(config.tokenIdHex, config.outputQtyArray);
    };
    Slp.prototype.buildRawNFT1GenesisTx = function (config, type) {
        if (type === void 0) { type = 0x01; }
        var config2 = {
            slpGenesisOpReturn: config.slpNFT1GenesisOpReturn,
            mintReceiverAddress: config.mintReceiverAddress,
            mintReceiverSatoshis: config.mintReceiverSatoshis,
            batonReceiverAddress: null,
            bchChangeReceiverAddress: config.bchChangeReceiverAddress,
            input_utxos: config.input_utxos,
            allowed_token_burning: [config.parentTokenIdHex]
        };
        return this.buildRawGenesisTx(config2);
    };
    Slp.prototype.buildRawGenesisTx = function (config, type) {
        var e_1, _a;
        if (type === void 0) { type = 0x01; }
        if (config.mintReceiverSatoshis === undefined)
            config.mintReceiverSatoshis = new bignumber_js_1.default(546);
        if (config.batonReceiverSatoshis === undefined)
            config.batonReceiverSatoshis = new bignumber_js_1.default(546);
        // Make sure we're not spending any token or baton UTXOs
        config.input_utxos.forEach(function (txo) {
            if (txo.slpUtxoJudgement === index_1.SlpUtxoJudgement.NOT_SLP)
                return;
            if (config.allowed_token_burning &&
                txo.slpUtxoJudgement === index_1.SlpUtxoJudgement.SLP_TOKEN &&
                !config.allowed_token_burning.includes(txo.slpTransactionDetails.tokenIdHex)) {
                throw Error("Input UTXOs included a token for another tokenId.");
            }
            else if (txo.slpUtxoJudgement === index_1.SlpUtxoJudgement.SLP_TOKEN) {
                throw Error("Input UTXOs included a token for another tokenId.");
            }
            if (txo.slpUtxoJudgement === index_1.SlpUtxoJudgement.SLP_BATON)
                throw Error("Cannot spend a minting baton.");
            if (txo.slpUtxoJudgement === index_1.SlpUtxoJudgement.INVALID_TOKEN_DAG || txo.slpUtxoJudgement === index_1.SlpUtxoJudgement.INVALID_BATON_DAG)
                throw Error("Cannot currently spend tokens and baton with invalid DAGs.");
            throw Error("Cannot spend utxo with no SLP judgement.");
        });
        // Check for slp formatted addresses
        if (!bchaddr.isSlpAddress(config.mintReceiverAddress))
            throw new Error("Not an SLP address.");
        if (config.batonReceiverAddress && !bchaddr.isSlpAddress(config.batonReceiverAddress))
            throw new Error("Not an SLP address.");
        config.mintReceiverAddress = bchaddr.toCashAddress(config.mintReceiverAddress);
        var transactionBuilder = new this.BITBOX.TransactionBuilder(utils_1.Utils.txnBuilderString(config.mintReceiverAddress));
        var satoshis = new bignumber_js_1.default(0);
        config.input_utxos.forEach(function (token_utxo) {
            transactionBuilder.addInput(token_utxo.txid, token_utxo.vout);
            satoshis = satoshis.plus(token_utxo.satoshis);
        });
        var genesisCost = this.calculateGenesisCost(config.slpGenesisOpReturn.length, config.input_utxos.length, config.batonReceiverAddress, config.bchChangeReceiverAddress);
        var bchChangeAfterFeeSatoshis = satoshis.minus(genesisCost);
        // Genesis OpReturn
        transactionBuilder.addOutput(config.slpGenesisOpReturn, 0);
        // Genesis token mint
        transactionBuilder.addOutput(config.mintReceiverAddress, config.mintReceiverSatoshis.toNumber());
        //bchChangeAfterFeeSatoshis -= config.mintReceiverSatoshis;
        // Baton address (optional)
        var batonvout = this.parseSlpOutputScript(config.slpGenesisOpReturn).batonVout;
        if (config.batonReceiverAddress) {
            config.batonReceiverAddress = bchaddr.toCashAddress(config.batonReceiverAddress);
            if (batonvout !== 2)
                throw Error("batonVout in transaction does not match OP_RETURN data.");
            transactionBuilder.addOutput(config.batonReceiverAddress, config.batonReceiverSatoshis.toNumber());
            //bchChangeAfterFeeSatoshis -= config.batonReceiverSatoshis;
        }
        else {
            // Make sure that batonVout is set to null
            if (batonvout)
                throw Error("OP_RETURN has batonVout set to vout=" + batonvout + ", but a baton receiver address was not provided.");
        }
        // Change (optional)
        if (config.bchChangeReceiverAddress && bchChangeAfterFeeSatoshis.isGreaterThan(new bignumber_js_1.default(546))) {
            config.bchChangeReceiverAddress = bchaddr.toCashAddress(config.bchChangeReceiverAddress);
            transactionBuilder.addOutput(config.bchChangeReceiverAddress, bchChangeAfterFeeSatoshis.toNumber());
        }
        // sign inputs
        var i = 0;
        try {
            for (var _b = __values(config.input_utxos), _c = _b.next(); !_c.done; _c = _b.next()) {
                var txo = _c.value;
                var paymentKeyPair = this.BITBOX.ECPair.fromWIF(txo.wif);
                transactionBuilder.sign(i, paymentKeyPair, undefined, transactionBuilder.hashTypes.SIGHASH_ALL, txo.satoshis.toNumber());
                i++;
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        var tx = transactionBuilder.build().toHex();
        // Check For Low Fee
        var outValue = transactionBuilder.transaction.tx.outs.reduce(function (v, o) { return v += o.value; }, 0);
        var inValue = config.input_utxos.reduce(function (v, i) { return v = v.plus(i.satoshis); }, new bignumber_js_1.default(0));
        if (inValue.minus(outValue).isLessThanOrEqualTo(tx.length / 2))
            throw Error("Transaction input BCH amount is too low.  Add more BCH inputs to fund this transaction.");
        // TODO: Check for fee too large or send leftover to target address
        return tx;
    };
    Slp.prototype.buildRawSendTx = function (config, type) {
        // Check proper address formats are given
        var e_2, _a;
        if (type === void 0) { type = 0x01; }
        config.tokenReceiverAddressArray.forEach(function (outputAddress) {
            if (!bchaddr.isSlpAddress(outputAddress))
                throw new Error("Token receiver address not in SlpAddr format.");
        });
        if (!bchaddr.isSlpAddress(config.bchChangeReceiverAddress))
            throw new Error("Token/BCH change receiver address is not in SLP format.");
        // Parse the SLP SEND OP_RETURN message
        var sendMsg = this.parseSlpOutputScript(config.slpSendOpReturn);
        // Make sure we're not spending inputs from any other token or baton
        var tokenInputQty = new bignumber_js_1.default(0);
        config.input_token_utxos.forEach(function (txo) {
            if (txo.slpUtxoJudgement === index_1.SlpUtxoJudgement.NOT_SLP)
                return;
            if (txo.slpUtxoJudgement === index_1.SlpUtxoJudgement.SLP_TOKEN) {
                if (txo.slpTransactionDetails.tokenIdHex !== sendMsg.tokenIdHex)
                    throw Error("Input UTXOs included a token for another tokenId.");
                tokenInputQty = tokenInputQty.plus(txo.slpUtxoJudgementAmount);
                return;
            }
            if (txo.slpUtxoJudgement === index_1.SlpUtxoJudgement.SLP_BATON)
                throw Error("Cannot spend a minting baton.");
            if (txo.slpUtxoJudgement === index_1.SlpUtxoJudgement.INVALID_TOKEN_DAG ||
                txo.slpUtxoJudgement === index_1.SlpUtxoJudgement.INVALID_BATON_DAG)
                throw Error("Cannot currently spend UTXOs with invalid DAGs.");
            throw Error("Cannot spend utxo with no SLP judgement.");
        });
        // Make sure the number of output receivers 
        // matches the outputs in the OP_RETURN message.
        var chgAddr = config.bchChangeReceiverAddress ? 1 : 0;
        if (!sendMsg.sendOutputs)
            throw Error("OP_RETURN contains no SLP send outputs.");
        if (config.tokenReceiverAddressArray.length + chgAddr !== sendMsg.sendOutputs.length)
            throw Error("Number of token receivers in config does not match the OP_RETURN outputs");
        // Make sure token inputs == token outputs
        var outputTokenQty = sendMsg.sendOutputs.reduce(function (v, o) { return v = v.plus(o); }, new bignumber_js_1.default(0));
        if (!tokenInputQty.isEqualTo(outputTokenQty))
            throw Error("Token input quantity does not match token outputs.");
        // Create a transaction builder
        var transactionBuilder = new this.BITBOX.TransactionBuilder(utils_1.Utils.txnBuilderString(config.tokenReceiverAddressArray[0]));
        //  let sequence = 0xffffffff - 1;
        //  let locktime = 0;
        // Calculate the total input amount & add all inputs to the transaction
        var inputSatoshis = config.input_token_utxos.reduce(function (t, i) { return t.plus(i.satoshis); }, new bignumber_js_1.default(0));
        config.input_token_utxos.forEach(function (token_utxo) { return transactionBuilder.addInput(token_utxo.txid, token_utxo.vout); }); //, sequence);
        // Calculate the amount of outputs set aside for special BCH-only outputs for fee calculation
        var bchOnlyCount = config.requiredNonTokenOutputs ? config.requiredNonTokenOutputs.length : 0;
        var bcOnlyOutputSatoshis = config.requiredNonTokenOutputs ? config.requiredNonTokenOutputs.reduce(function (t, v) { return t += v.satoshis; }, 0) : 0;
        // Calculate mining fee cost
        var sendCost = this.calculateSendCost(config.slpSendOpReturn.length, config.input_token_utxos.length, config.tokenReceiverAddressArray.length + bchOnlyCount, config.bchChangeReceiverAddress);
        // Compute BCH change amount
        var bchChangeAfterFeeSatoshis = inputSatoshis
            .minus(sendCost)
            .minus(bcOnlyOutputSatoshis)
            .minus(config.extraFee ? config.extraFee : 0);
        // Start adding outputs to transaction
        // Add SLP SEND OP_RETURN message
        transactionBuilder.addOutput(config.slpSendOpReturn, 0);
        // Add dust dust outputs associated with tokens
        config.tokenReceiverAddressArray.forEach(function (outputAddress) {
            outputAddress = bchaddr.toCashAddress(outputAddress);
            transactionBuilder.addOutput(outputAddress, 546);
        });
        // Add BCH-only outputs
        if (config.requiredNonTokenOutputs && config.requiredNonTokenOutputs.length > 0) {
            config.requiredNonTokenOutputs.forEach(function (output) {
                var outputAddress = bchaddr.toCashAddress(output.receiverAddress);
                transactionBuilder.addOutput(outputAddress, output.satoshis);
            });
        }
        // Add change, if any
        if (bchChangeAfterFeeSatoshis.isGreaterThan(new bignumber_js_1.default(546))) {
            config.bchChangeReceiverAddress = bchaddr.toCashAddress(config.bchChangeReceiverAddress);
            transactionBuilder.addOutput(config.bchChangeReceiverAddress, bchChangeAfterFeeSatoshis.toNumber());
        }
        // Sign txn and add sig to p2pkh input for convenience if wif is provided, 
        // otherwise skip signing.
        var i = 0;
        var isComplete = true;
        try {
            for (var _b = __values(config.input_token_utxos), _c = _b.next(); !_c.done; _c = _b.next()) {
                var txo = _c.value;
                if (txo.wif) {
                    var paymentKeyPair = this.BITBOX.ECPair.fromWIF(txo.wif);
                    transactionBuilder.sign(i, paymentKeyPair, undefined, transactionBuilder.hashTypes.SIGHASH_ALL, txo.satoshis.toNumber());
                }
                else
                    isComplete = false;
                i++;
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
        // Build the transaction to hex and return
        // warn user if the transaction was not fully signed
        var hex;
        if (!isComplete) {
            console.log("WARNING: Transaction signing is not complete.");
            var tx = transactionBuilder.transaction.buildIncomplete();
            //  tx.locktime = locktime;
            hex = tx.toHex();
        }
        else
            hex = transactionBuilder.build().toHex();
        // Check For Low Fee
        var outValue = transactionBuilder.transaction.tx.outs.reduce(function (v, o) { return v += o.value; }, 0);
        var inValue = config.input_token_utxos.reduce(function (v, i) { return v = v.plus(i.satoshis); }, new bignumber_js_1.default(0));
        if (inValue.minus(outValue).isLessThanOrEqualTo(hex.length / 2))
            throw Error("Transaction input BCH amount is too low.  Add more BCH inputs to fund this transaction.");
        return hex;
    };
    Slp.prototype.buildRawMintTx = function (config, type) {
        var e_3, _a;
        if (type === void 0) { type = 0x01; }
        var mintMsg = this.parseSlpOutputScript(config.slpMintOpReturn);
        if (config.mintReceiverSatoshis === undefined)
            config.mintReceiverSatoshis = new bignumber_js_1.default(546);
        if (config.batonReceiverSatoshis === undefined)
            config.batonReceiverSatoshis = new bignumber_js_1.default(546);
        // Check for slp formatted addresses
        if (!bchaddr.isSlpAddress(config.mintReceiverAddress)) {
            throw new Error("Mint receiver address not in SLP format.");
        }
        if (config.batonReceiverAddress && !bchaddr.isSlpAddress(config.batonReceiverAddress)) {
            throw new Error("Baton receiver address not in SLP format.");
        }
        config.mintReceiverAddress = bchaddr.toCashAddress(config.mintReceiverAddress);
        if (config.batonReceiverAddress)
            config.batonReceiverAddress = bchaddr.toCashAddress(config.batonReceiverAddress);
        // Make sure inputs don't include spending any tokens or batons for other tokenIds
        config.input_baton_utxos.forEach(function (txo) {
            if (txo.slpUtxoJudgement === index_1.SlpUtxoJudgement.NOT_SLP)
                return;
            if (txo.slpUtxoJudgement === index_1.SlpUtxoJudgement.SLP_TOKEN)
                throw Error("Input UTXOs should not include any tokens.");
            if (txo.slpUtxoJudgement === index_1.SlpUtxoJudgement.SLP_BATON) {
                if (txo.slpTransactionDetails.tokenIdHex !== mintMsg.tokenIdHex)
                    throw Error("Cannot spend a minting baton.");
                return;
            }
            if (txo.slpUtxoJudgement === index_1.SlpUtxoJudgement.INVALID_TOKEN_DAG || txo.slpUtxoJudgement === index_1.SlpUtxoJudgement.INVALID_BATON_DAG)
                throw Error("Cannot currently spend UTXOs with invalid DAGs.");
            throw Error("Cannot spend utxo with no SLP judgement.");
        });
        // Make sure inputs include the baton for this tokenId
        if (!config.input_baton_utxos.find(function (o) { return o.slpUtxoJudgement === index_1.SlpUtxoJudgement.SLP_BATON; }))
            Error("There is no baton included with the input UTXOs.");
        var transactionBuilder = new this.BITBOX.TransactionBuilder(utils_1.Utils.txnBuilderString(config.mintReceiverAddress));
        var satoshis = new bignumber_js_1.default(0);
        config.input_baton_utxos.forEach(function (baton_utxo) {
            transactionBuilder.addInput(baton_utxo.txid, baton_utxo.vout);
            satoshis = satoshis.plus(baton_utxo.satoshis);
        });
        var mintCost = this.calculateGenesisCost(config.slpMintOpReturn.length, config.input_baton_utxos.length, config.batonReceiverAddress, config.bchChangeReceiverAddress);
        var bchChangeAfterFeeSatoshis = satoshis.minus(mintCost);
        // Mint OpReturn
        transactionBuilder.addOutput(config.slpMintOpReturn, 0);
        // Mint token mint
        transactionBuilder.addOutput(config.mintReceiverAddress, config.mintReceiverSatoshis.toNumber());
        //bchChangeAfterFeeSatoshis -= config.mintReceiverSatoshis;
        // Baton address (optional)
        if (config.batonReceiverAddress !== null) {
            config.batonReceiverAddress = bchaddr.toCashAddress(config.batonReceiverAddress);
            if (this.parseSlpOutputScript(config.slpMintOpReturn).batonVout !== 2)
                throw Error("batonVout in transaction does not match OP_RETURN data.");
            transactionBuilder.addOutput(config.batonReceiverAddress, config.batonReceiverSatoshis.toNumber());
            //bchChangeAfterFeeSatoshis -= config.batonReceiverSatoshis;
        }
        // Change (optional)
        if (config.bchChangeReceiverAddress && bchChangeAfterFeeSatoshis.isGreaterThan(new bignumber_js_1.default(546))) {
            config.bchChangeReceiverAddress = bchaddr.toCashAddress(config.bchChangeReceiverAddress);
            transactionBuilder.addOutput(config.bchChangeReceiverAddress, bchChangeAfterFeeSatoshis.toNumber());
        }
        // sign inputs
        var i = 0;
        try {
            for (var _b = __values(config.input_baton_utxos), _c = _b.next(); !_c.done; _c = _b.next()) {
                var txo = _c.value;
                var paymentKeyPair = this.BITBOX.ECPair.fromWIF(txo.wif);
                transactionBuilder.sign(i, paymentKeyPair, undefined, transactionBuilder.hashTypes.SIGHASH_ALL, txo.satoshis.toNumber());
                i++;
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_3) throw e_3.error; }
        }
        var tx = transactionBuilder.build().toHex();
        // Check For Low Fee
        var outValue = transactionBuilder.transaction.tx.outs.reduce(function (v, o) { return v += o.value; }, 0);
        var inValue = config.input_baton_utxos.reduce(function (v, i) { return v = v.plus(i.satoshis); }, new bignumber_js_1.default(0));
        if (inValue.minus(outValue).isLessThanOrEqualTo(tx.length / 2))
            throw Error("Transaction input BCH amount is too low.  Add more BCH inputs to fund this transaction.");
        // TODO: Check for fee too large or send leftover to target address
        return tx;
    };
    Slp.prototype.buildRawBurnTx = function (burnAmount, config, type) {
        var e_4, _a;
        if (type === void 0) { type = 0x01; }
        var sendMsg;
        if (config.slpBurnOpReturn) {
            sendMsg = this.parseSlpOutputScript(config.slpBurnOpReturn);
            if (!sendMsg.sendOutputs)
                throw Error("OP_RETURN contains no SLP send outputs for token change.");
            if (sendMsg.sendOutputs.length !== 2)
                throw Error("Burn transaction must have only a single change receiver for token change.");
            if (sendMsg.sendOutputs.length === 2 && !config.bchChangeReceiverAddress)
                throw new Error("Token/BCH change address is not provided.");
            if (!bchaddr.isSlpAddress(config.bchChangeReceiverAddress))
                throw new Error("Token/BCH change receiver address is not in SLP format.");
        }
        else if (!config.tokenIdHex)
            console.log("[WARNING!] Include 'config.tokenIdHex' in order to accidental token burning.  To supress this log message set 'config.tokenIdHex' to an empty string.");
        // Make sure not spending any other tokens or baton UTXOs
        var tokenInputQty = new bignumber_js_1.default(0);
        config.input_token_utxos.forEach(function (txo) {
            if (txo.slpUtxoJudgement === index_1.SlpUtxoJudgement.NOT_SLP)
                return;
            if (txo.slpUtxoJudgement === index_1.SlpUtxoJudgement.SLP_TOKEN) {
                if (sendMsg) {
                    if (txo.slpTransactionDetails.tokenIdHex !== sendMsg.tokenIdHex)
                        throw Error("Input UTXOs included a token for another tokenId.");
                }
                else {
                    if (txo.slpTransactionDetails.tokenIdHex !== config.tokenIdHex)
                        throw Error("Input UTXOs included a token for another tokenId.");
                }
                tokenInputQty = tokenInputQty.plus(txo.slpUtxoJudgementAmount);
                return;
            }
            if (txo.slpUtxoJudgement === index_1.SlpUtxoJudgement.SLP_BATON)
                throw Error("Cannot spend a minting baton.");
            if (txo.slpUtxoJudgement === index_1.SlpUtxoJudgement.INVALID_TOKEN_DAG || txo.slpUtxoJudgement === index_1.SlpUtxoJudgement.INVALID_BATON_DAG)
                throw Error("Cannot currently spend UTXOs with invalid DAGs.");
            throw Error("Cannot spend utxo with no SLP judgement.");
        });
        // Make sure the number of output receivers matches the outputs in the OP_RETURN message.
        if (config.slpBurnOpReturn) {
            //let chgAddr = config.bchChangeReceiverAddress ? 1 : 0;
            // Make sure token inputs equals token outputs in OP_RETURN
            var outputTokenQty = sendMsg.sendOutputs.reduce(function (v, o) { return v = v.plus(o); }, new bignumber_js_1.default(0));
            if (!tokenInputQty.minus(outputTokenQty).isEqualTo(burnAmount))
                throw Error("Token burn output quantity must be less than token input quantity.");
        }
        var transactionBuilder = new this.BITBOX.TransactionBuilder(utils_1.Utils.txnBuilderString(config.bchChangeReceiverAddress));
        var inputSatoshis = new bignumber_js_1.default(0);
        config.input_token_utxos.forEach(function (token_utxo) {
            transactionBuilder.addInput(token_utxo.txid, token_utxo.vout);
            inputSatoshis = inputSatoshis.plus(token_utxo.satoshis);
        });
        var msgLength = config.slpBurnOpReturn ? config.slpBurnOpReturn.length : 0;
        var sendCost = this.calculateSendCost(msgLength, config.input_token_utxos.length, msgLength > 0 ? 1 : 0, config.bchChangeReceiverAddress);
        var bchChangeAfterFeeSatoshis = inputSatoshis.minus(sendCost);
        // Burn change OpReturn / token change output
        if (config.slpBurnOpReturn) {
            transactionBuilder.addOutput(config.slpBurnOpReturn, 0);
            var outputAddress = bchaddr.toCashAddress(config.bchChangeReceiverAddress);
            transactionBuilder.addOutput(outputAddress, 546);
        }
        // Change
        if (bchChangeAfterFeeSatoshis.isGreaterThan(new bignumber_js_1.default(546))) {
            config.bchChangeReceiverAddress = bchaddr.toCashAddress(config.bchChangeReceiverAddress);
            transactionBuilder.addOutput(config.bchChangeReceiverAddress, bchChangeAfterFeeSatoshis.toNumber());
        }
        // sign inputs
        var i = 0;
        try {
            for (var _b = __values(config.input_token_utxos), _c = _b.next(); !_c.done; _c = _b.next()) {
                var txo = _c.value;
                var paymentKeyPair = this.BITBOX.ECPair.fromWIF(txo.wif);
                transactionBuilder.sign(i, paymentKeyPair, undefined, transactionBuilder.hashTypes.SIGHASH_ALL, txo.satoshis.toNumber());
                i++;
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_4) throw e_4.error; }
        }
        var tx = transactionBuilder.build().toHex();
        // Check For Low Fee
        var outValue = transactionBuilder.transaction.tx.outs.reduce(function (v, o) { return v += o.value; }, 0);
        var inValue = config.input_token_utxos.reduce(function (v, i) { return v = v.plus(i.satoshis); }, new bignumber_js_1.default(0));
        if (inValue.minus(outValue).isLessThanOrEqualTo(tx.length / 2))
            throw Error("Transaction input BCH amount is too low.  Add more BCH inputs to fund this transaction.");
        return tx;
    };
    Slp.prototype.buildRawBchOnlyTx = function (config) {
        var e_5, _a;
        config.bchReceiverAddressArray.forEach(function (outputAddress) {
            if (!bchaddr.isSlpAddress(outputAddress) && !bchaddr.isCashAddress(outputAddress))
                throw new Error("Token receiver address not in SlpAddr or CashAddr format.");
        });
        // Make sure not spending ANY tokens or baton UTXOs
        config.input_token_utxos.forEach(function (txo) {
            if (txo.slpUtxoJudgement === index_1.SlpUtxoJudgement.NOT_SLP)
                return;
            if (txo.slpUtxoJudgement === index_1.SlpUtxoJudgement.SLP_TOKEN) {
                throw Error("Input UTXOs included a token for another tokenId.");
            }
            if (txo.slpUtxoJudgement === index_1.SlpUtxoJudgement.SLP_BATON)
                throw Error("Cannot spend a minting baton.");
            if (txo.slpUtxoJudgement === index_1.SlpUtxoJudgement.INVALID_TOKEN_DAG || txo.slpUtxoJudgement === index_1.SlpUtxoJudgement.INVALID_BATON_DAG)
                throw Error("Cannot currently spend UTXOs with invalid DAGs.");
            throw Error("Cannot spend utxo with no SLP judgement.");
        });
        var transactionBuilder = new this.BITBOX.TransactionBuilder(utils_1.Utils.txnBuilderString(config.bchReceiverAddressArray[0]));
        var inputSatoshis = new bignumber_js_1.default(0);
        config.input_token_utxos.forEach(function (token_utxo) {
            transactionBuilder.addInput(token_utxo.txid, token_utxo.vout);
            inputSatoshis = inputSatoshis.plus(token_utxo.satoshis);
        });
        var sendCost = this.calculateSendCost(0, config.input_token_utxos.length, config.bchReceiverAddressArray.length, config.bchChangeReceiverAddress, 1, false);
        var bchChangeAfterFeeSatoshis = inputSatoshis.minus(sendCost).minus(config.bchReceiverSatoshiAmounts.reduce(function (t, v) { return t = t.plus(v); }, new bignumber_js_1.default(0)));
        // BCH outputs
        config.bchReceiverAddressArray.forEach(function (outputAddress, i) {
            outputAddress = bchaddr.toCashAddress(outputAddress);
            transactionBuilder.addOutput(outputAddress, Math.round(config.bchReceiverSatoshiAmounts[i].toNumber()));
        });
        // Change
        if (bchChangeAfterFeeSatoshis.isGreaterThan(new bignumber_js_1.default(546))) {
            config.bchChangeReceiverAddress = bchaddr.toCashAddress(config.bchChangeReceiverAddress);
            transactionBuilder.addOutput(config.bchChangeReceiverAddress, bchChangeAfterFeeSatoshis.toNumber());
        }
        // sign inputs
        var i = 0;
        try {
            for (var _b = __values(config.input_token_utxos), _c = _b.next(); !_c.done; _c = _b.next()) {
                var txo = _c.value;
                var paymentKeyPair = this.BITBOX.ECPair.fromWIF(txo.wif);
                transactionBuilder.sign(i, paymentKeyPair, undefined, transactionBuilder.hashTypes.SIGHASH_ALL, txo.satoshis.toNumber());
                i++;
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_5) throw e_5.error; }
        }
        var tx = transactionBuilder.build().toHex();
        // Check For Low Fee
        var outValue = transactionBuilder.transaction.tx.outs.reduce(function (v, o) { return v += o.value; }, 0);
        var inValue = config.input_token_utxos.reduce(function (v, i) { return v = v.plus(i.satoshis); }, new bignumber_js_1.default(0));
        if (inValue.minus(outValue).isLessThanOrEqualTo(tx.length / 2))
            throw Error("Transaction input BCH amount is too low.  Add more BCH inputs to fund this transaction.");
        // TODO: Check for fee too large or send leftover to target address
        return tx;
    };
    Slp.prototype.parseSlpOutputScript = function (outputScript) {
        var slpMsg = {};
        var chunks;
        try {
            chunks = this.parseOpReturnToChunks(outputScript);
        }
        catch (e) {
            throw Error('Bad OP_RETURN');
        }
        if (chunks.length === 0)
            throw Error('Empty OP_RETURN');
        if (!chunks[0])
            throw Error("Not SLP");
        if (!chunks[0].equals(Buffer.from(this.lokadIdHex, 'hex')))
            throw Error('Not SLP');
        if (chunks.length === 1)
            throw Error("Missing token versionType");
        // # check if the token version is supported
        if (!chunks[1])
            throw Error("Bad versionType buffer");
        slpMsg.versionType = Slp.parseChunkToInt(chunks[1], 1, 2, true);
        if (slpMsg.versionType !== index_1.SlpVersionType.TokenVersionType1)
            throw Error('Unsupported token type: ' + slpMsg.versionType);
        if (chunks.length === 2)
            throw Error('Missing SLP transaction type');
        try {
            var msgType = chunks[2].toString('ascii');
            slpMsg.transactionType = index_1.SlpTransactionType[msgType];
        }
        catch (_) {
            throw Error('Bad transaction type');
        }
        if (slpMsg.transactionType === index_1.SlpTransactionType.GENESIS) {
            if (chunks.length !== 10)
                throw Error('GENESIS with incorrect number of parameters');
            slpMsg.symbol = chunks[3] ? chunks[3].toString('utf8') : '';
            slpMsg.name = chunks[4] ? chunks[4].toString('utf8') : '';
            slpMsg.documentUri = chunks[5] ? chunks[5].toString('utf8') : '';
            slpMsg.documentSha256 = chunks[6] ? chunks[6] : null;
            if (slpMsg.documentSha256) {
                if (slpMsg.documentSha256.length !== 0 && slpMsg.documentSha256.length !== 32)
                    throw Error('Token document hash is incorrect length');
            }
            if (!chunks[7])
                throw Error("Bad decimals buffer");
            slpMsg.decimals = Slp.parseChunkToInt(chunks[7], 1, 1, true);
            if (slpMsg.decimals > 9)
                throw Error('Too many decimals');
            slpMsg.batonVout = chunks[8] ? Slp.parseChunkToInt(chunks[8], 1, 1) : null;
            if (slpMsg.batonVout !== null) {
                if (slpMsg.batonVout < 2)
                    throw Error('Mint baton cannot be on vout=0 or 1');
                slpMsg.containsBaton = true;
            }
            if (!chunks[9])
                throw Error("Bad Genesis quantity buffer");
            if (chunks[9].length !== 8)
                throw Error("Genesis quantity must be provided as an 8-byte buffer");
            slpMsg.genesisOrMintQuantity = utils_1.Utils.buffer2BigNumber(chunks[9]);
        }
        else if (slpMsg.transactionType === index_1.SlpTransactionType.SEND) {
            if (chunks.length < 4)
                throw Error('SEND with too few parameters');
            if (!chunks[3])
                throw Error("Bad tokenId buffer");
            if (chunks[3].length !== 32)
                throw Error('token_id is wrong length');
            slpMsg.tokenIdHex = chunks[3].toString('hex');
            // # Note that we put an explicit 0 for  ['token_output'][0] since it
            // # corresponds to vout=0, which is the OP_RETURN tx output.
            // # ['token_output'][1] is the first token output given by the SLP
            // # message, i.e., the number listed as `token_output_quantity1` in the
            // # spec, which goes to tx output vout=1.
            slpMsg.sendOutputs = [];
            slpMsg.sendOutputs.push(new bignumber_js_1.default(0));
            chunks.slice(4).forEach(function (chunk) {
                if (!chunk)
                    throw Error("Bad send quantity buffer.");
                if (chunk.length !== 8)
                    throw Error('SEND quantities must be 8-bytes each.');
                slpMsg.sendOutputs.push(utils_1.Utils.buffer2BigNumber(chunk));
            });
            // # maximum 19 allowed token outputs, plus 1 for the explicit [0] we inserted.
            if (slpMsg.sendOutputs.length < 2)
                throw Error('Missing output amounts');
            if (slpMsg.sendOutputs.length > 20)
                throw Error('More than 19 output amounts');
        }
        else if (slpMsg.transactionType === index_1.SlpTransactionType.MINT) {
            if (chunks.length != 6)
                throw Error('MINT with incorrect number of parameters');
            if (!chunks[3])
                throw Error("Bad token_id buffer");
            if (chunks[3].length != 32)
                throw Error('token_id is wrong length');
            slpMsg.tokenIdHex = chunks[3].toString('hex');
            slpMsg.batonVout = chunks[4] ? Slp.parseChunkToInt(chunks[4], 1, 1) : null;
            if (slpMsg.batonVout !== null && slpMsg.batonVout !== undefined) {
                if (slpMsg.batonVout < 2)
                    throw Error('Mint baton cannot be on vout=0 or 1');
                slpMsg.containsBaton = true;
            }
            if (!chunks[5])
                throw Error("Bad Mint quantity buffer");
            if (chunks[5].length !== 8)
                throw Error("Mint quantity must be provided as an 8-byte buffer");
            slpMsg.genesisOrMintQuantity = utils_1.Utils.buffer2BigNumber(chunks[5]);
        }
        else
            throw Error("Bad transaction type");
        if (!slpMsg.genesisOrMintQuantity && (!slpMsg.sendOutputs || slpMsg.sendOutputs.length === 0))
            throw Error("SLP message must have either Genesis/Mint outputs or Send outputs, both are missing");
        return slpMsg;
    };
    Slp.parseChunkToInt = function (intBytes, minByteLen, maxByteLen, raise_on_Null) {
        if (raise_on_Null === void 0) { raise_on_Null = false; }
        // # Parse data as unsigned-big-endian encoded integer.
        // # For empty data different possibilities may occur:
        // #      minByteLen <= 0 : return 0
        // #      raise_on_Null == False and minByteLen > 0: return None
        // #      raise_on_Null == True and minByteLen > 0:  raise SlpInvalidOutputMessage
        if (intBytes.length >= minByteLen && intBytes.length <= maxByteLen)
            return intBytes.readUIntBE(0, intBytes.length);
        if (intBytes.length === 0 && !raise_on_Null)
            return null;
        throw Error('Field has wrong length');
    };
    // get list of data chunks resulting from data push operations
    Slp.prototype.parseOpReturnToChunks = function (script, allow_op_0, allow_op_number) {
        var _this = this;
        if (allow_op_0 === void 0) { allow_op_0 = false; }
        if (allow_op_number === void 0) { allow_op_number = false; }
        // """Extract pushed bytes after opreturn. Returns list of bytes() objects,
        // one per push.
        var ops;
        // Strict refusal of non-push opcodes; bad scripts throw OpreturnError."""
        try {
            ops = this.getScriptOperations(script);
        }
        catch (e) {
            //console.log(e);
            throw Error('Script error');
        }
        if (ops[0].opcode !== this.BITBOX.Script.opcodes.OP_RETURN)
            throw Error('No OP_RETURN');
        var chunks = [];
        ops.slice(1).forEach(function (opitem) {
            if (opitem.opcode > _this.BITBOX.Script.opcodes.OP_16)
                throw Error("Non-push opcode");
            if (opitem.opcode > _this.BITBOX.Script.opcodes.OP_PUSHDATA4) {
                if (opitem.opcode === 80)
                    throw Error('Non-push opcode');
                if (!allow_op_number)
                    throw Error('OP_1NEGATE to OP_16 not allowed');
                if (opitem.opcode === _this.BITBOX.Script.opcodes.OP_1NEGATE)
                    opitem.data = Buffer.from([0x81]);
                else // OP_1 - OP_16
                    opitem.data = Buffer.from([opitem.opcode - 80]);
            }
            if (opitem.opcode === _this.BITBOX.Script.opcodes.OP_0 && !allow_op_0) {
                throw Error('OP_0 not allowed');
            }
            chunks.push(opitem.data);
        });
        //console.log(chunks);
        return chunks;
    };
    // Get a list of operations with accompanying push data (if a push opcode)
    Slp.prototype.getScriptOperations = function (script) {
        var ops = [];
        try {
            var n = 0;
            var dlen = void 0;
            while (n < script.length) {
                var op = { opcode: script[n], data: null };
                n += 1;
                if (op.opcode <= this.BITBOX.Script.opcodes.OP_PUSHDATA4) {
                    if (op.opcode < this.BITBOX.Script.opcodes.OP_PUSHDATA1)
                        dlen = op.opcode;
                    else if (op.opcode === this.BITBOX.Script.opcodes.OP_PUSHDATA1) {
                        dlen = script[n];
                        n += 1;
                    }
                    else if (op.opcode === this.BITBOX.Script.opcodes.OP_PUSHDATA2) {
                        dlen = script.slice(n, n + 2).readUIntLE(0, 2);
                        n += 2;
                    }
                    else {
                        dlen = script.slice(n, n + 4).readUIntLE(0, 4);
                        n += 4;
                    }
                    if ((n + dlen) > script.length) {
                        throw Error('IndexError');
                    }
                    if (dlen > 0)
                        op.data = script.slice(n, n + dlen);
                    n += dlen;
                }
                ops.push(op);
            }
        }
        catch (e) {
            //console.log(e);
            throw Error('truncated script');
        }
        return ops;
    };
    Slp.prototype.calculateGenesisCost = function (genesisOpReturnLength, inputUtxoSize, batonAddress, bchChangeAddress, feeRate) {
        if (feeRate === void 0) { feeRate = 1; }
        return this.calculateMintOrGenesisCost(genesisOpReturnLength, inputUtxoSize, batonAddress, bchChangeAddress, feeRate);
    };
    Slp.prototype.calculateMintCost = function (mintOpReturnLength, inputUtxoSize, batonAddress, bchChangeAddress, feeRate) {
        if (feeRate === void 0) { feeRate = 1; }
        return this.calculateMintOrGenesisCost(mintOpReturnLength, inputUtxoSize, batonAddress, bchChangeAddress, feeRate);
    };
    Slp.prototype.calculateMintOrGenesisCost = function (mintOpReturnLength, inputUtxoSize, batonAddress, bchChangeAddress, feeRate) {
        if (feeRate === void 0) { feeRate = 1; }
        var outputs = 1;
        var nonfeeoutputs = 546;
        if (batonAddress !== null && batonAddress !== undefined) {
            nonfeeoutputs += 546;
            outputs += 1;
        }
        if (bchChangeAddress !== null && bchChangeAddress !== undefined) {
            outputs += 1;
        }
        var fee = this.BITBOX.BitcoinCash.getByteCount({ P2PKH: inputUtxoSize }, { P2PKH: outputs });
        fee += mintOpReturnLength;
        fee += 10; // added to account for OP_RETURN ammount of 0000000000000000
        fee *= feeRate;
        //console.log("MINT/GENESIS cost before outputs: " + fee.toString());
        fee += nonfeeoutputs;
        //console.log("MINT/GENESIS cost after outputs are added: " + fee.toString());
        return fee;
    };
    Slp.prototype.calculateSendCost = function (sendOpReturnLength, inputUtxoSize, outputAddressArraySize, bchChangeAddress, feeRate, forTokens) {
        if (feeRate === void 0) { feeRate = 1; }
        if (forTokens === void 0) { forTokens = true; }
        var outputs = outputAddressArraySize;
        var nonfeeoutputs = 0;
        if (forTokens)
            nonfeeoutputs = outputAddressArraySize * 546;
        if (bchChangeAddress !== null && bchChangeAddress !== undefined) {
            outputs += 1;
        }
        var fee = this.BITBOX.BitcoinCash.getByteCount({ P2PKH: inputUtxoSize }, { P2PKH: outputs });
        fee += sendOpReturnLength;
        fee += 10; // added to account for OP_RETURN ammount of 0000000000000000
        fee *= feeRate;
        //console.log("SEND cost before outputs: " + fee.toString());
        fee += nonfeeoutputs;
        //console.log("SEND cost after outputs are added: " + fee.toString());
        return fee;
    };
    Slp.preSendSlpJudgementCheck = function (txo, tokenId) {
        if (txo.slpUtxoJudgement === undefined || txo.slpUtxoJudgement === null || txo.slpUtxoJudgement === index_1.SlpUtxoJudgement.UNKNOWN)
            throw Error("There at least one input UTXO that does not have a proper SLP judgement");
        if (txo.slpUtxoJudgement === index_1.SlpUtxoJudgement.SLP_BATON)
            throw Error("There is at least one input UTXO that is a baton.  You can only spend batons in a MINT transaction.");
        if (txo.slpTransactionDetails) {
            if (txo.slpUtxoJudgement === index_1.SlpUtxoJudgement.SLP_TOKEN) {
                if (!txo.slpUtxoJudgementAmount)
                    throw Error("There is at least one input token that does not have the 'slpUtxoJudgementAmount' property set.");
                if (txo.slpTransactionDetails.tokenIdHex !== tokenId)
                    throw Error("There is at least one input UTXO that is a different SLP token than the one specified.");
                return txo.slpTransactionDetails.tokenIdHex === tokenId;
            }
        }
        return false;
    };
    Slp.prototype.processUtxosForSlpAbstract = function (utxos, asyncSlpValidator) {
        return __awaiter(this, void 0, void 0, function () {
            var e_6, _a, utxos_1, utxos_1_1, txo, result, tokenTxoCount, id, batonTxoCount, id;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        try {
                            // 1) parse SLP OP_RETURN and cast initial SLP judgement, based on OP_RETURN only.
                            for (utxos_1 = __values(utxos), utxos_1_1 = utxos_1.next(); !utxos_1_1.done; utxos_1_1 = utxos_1.next()) {
                                txo = utxos_1_1.value;
                                this.applyInitialSlpJudgement(txo);
                                if (txo.slpUtxoJudgement === index_1.SlpUtxoJudgement.UNKNOWN || txo.slpUtxoJudgement === undefined)
                                    throw Error('Utxo SLP judgement has not been set, unknown error.');
                            }
                        }
                        catch (e_6_1) { e_6 = { error: e_6_1 }; }
                        finally {
                            try {
                                if (utxos_1_1 && !utxos_1_1.done && (_a = utxos_1.return)) _a.call(utxos_1);
                            }
                            finally { if (e_6) throw e_6.error; }
                        }
                        // 2) Cast final SLP judgement using the supplied async validator
                        return [4 /*yield*/, this.applyFinalSlpJudgement(asyncSlpValidator, utxos)];
                    case 1:
                        // 2) Cast final SLP judgement using the supplied async validator
                        _b.sent();
                        result = this.computeSlpBalances(utxos);
                        tokenTxoCount = 0;
                        for (id in result.slpTokenUtxos)
                            tokenTxoCount += result.slpTokenUtxos[id].length;
                        batonTxoCount = 0;
                        for (id in result.slpBatonUtxos)
                            batonTxoCount += result.slpBatonUtxos[id].length;
                        if (utxos.length !== (tokenTxoCount + batonTxoCount + result.nonSlpUtxos.length + result.invalidBatonUtxos.length + result.invalidTokenUtxos.length))
                            throw Error('Not all UTXOs have been categorized. Unknown Error.');
                        return [2 /*return*/, result];
                }
            });
        });
    };
    Slp.prototype.computeSlpBalances = function (utxos) {
        var e_7, _a;
        var result = {
            satoshis_available_bch: 0,
            satoshis_in_slp_baton: 0,
            satoshis_in_slp_token: 0,
            satoshis_in_invalid_token_dag: 0,
            satoshis_in_invalid_baton_dag: 0,
            slpTokenBalances: {},
            slpTokenUtxos: {},
            slpBatonUtxos: {},
            nonSlpUtxos: [],
            invalidTokenUtxos: [],
            invalidBatonUtxos: []
        };
        try {
            // 5) Loop through UTXO set and accumulate balances for type of utxo, organize the Utxos into their categories.
            for (var utxos_2 = __values(utxos), utxos_2_1 = utxos_2.next(); !utxos_2_1.done; utxos_2_1 = utxos_2.next()) {
                var txo = utxos_2_1.value;
                if (txo.slpUtxoJudgement === index_1.SlpUtxoJudgement.SLP_TOKEN) {
                    if (!(txo.slpTransactionDetails.tokenIdHex in result.slpTokenBalances))
                        result.slpTokenBalances[txo.slpTransactionDetails.tokenIdHex] = new bignumber_js_1.default(0);
                    if (txo.slpTransactionDetails.transactionType === index_1.SlpTransactionType.GENESIS || txo.slpTransactionDetails.transactionType === index_1.SlpTransactionType.MINT) {
                        result.slpTokenBalances[txo.slpTransactionDetails.tokenIdHex] = result.slpTokenBalances[txo.slpTransactionDetails.tokenIdHex].plus(txo.slpTransactionDetails.genesisOrMintQuantity);
                    }
                    else if (txo.slpTransactionDetails.transactionType === index_1.SlpTransactionType.SEND && txo.slpTransactionDetails.sendOutputs) {
                        var qty = txo.slpTransactionDetails.sendOutputs[txo.vout];
                        result.slpTokenBalances[txo.slpTransactionDetails.tokenIdHex] = result.slpTokenBalances[txo.slpTransactionDetails.tokenIdHex].plus(qty);
                    }
                    else {
                        throw Error('Unknown Error: cannot have an SLP_TOKEN that is not from GENESIS, MINT, or SEND.');
                    }
                    result.satoshis_in_slp_token += txo.satoshis;
                    if (!(txo.slpTransactionDetails.tokenIdHex in result.slpTokenUtxos))
                        result.slpTokenUtxos[txo.slpTransactionDetails.tokenIdHex] = [];
                    result.slpTokenUtxos[txo.slpTransactionDetails.tokenIdHex].push(txo);
                }
                else if (txo.slpUtxoJudgement === index_1.SlpUtxoJudgement.SLP_BATON) {
                    result.satoshis_in_slp_baton += txo.satoshis;
                    if (!(txo.slpTransactionDetails.tokenIdHex in result.slpBatonUtxos))
                        result.slpBatonUtxos[txo.slpTransactionDetails.tokenIdHex] = [];
                    result.slpBatonUtxos[txo.slpTransactionDetails.tokenIdHex].push(txo);
                }
                else if (txo.slpUtxoJudgement === index_1.SlpUtxoJudgement.INVALID_TOKEN_DAG) {
                    result.satoshis_in_invalid_token_dag += txo.satoshis;
                    result.invalidTokenUtxos.push(txo);
                }
                else if (txo.slpUtxoJudgement === index_1.SlpUtxoJudgement.INVALID_BATON_DAG) {
                    result.satoshis_in_invalid_baton_dag += txo.satoshis;
                    result.invalidBatonUtxos.push(txo);
                }
                else {
                    result.satoshis_available_bch += txo.satoshis;
                    result.nonSlpUtxos.push(txo);
                }
            }
        }
        catch (e_7_1) { e_7 = { error: e_7_1 }; }
        finally {
            try {
                if (utxos_2_1 && !utxos_2_1.done && (_a = utxos_2.return)) _a.call(utxos_2);
            }
            finally { if (e_7) throw e_7.error; }
        }
        return result;
    };
    Slp.prototype.applyInitialSlpJudgement = function (txo) {
        try {
            var vout = txo.tx.vout.find(function (vout) { return vout.n === 0; });
            if (!vout)
                throw 'Utxo contains no Vout!';
            var vout0script = Buffer.from(vout.scriptPubKey.hex, 'hex');
            txo.slpTransactionDetails = this.parseSlpOutputScript(vout0script);
            // populate txid for GENESIS
            if (txo.slpTransactionDetails.transactionType === index_1.SlpTransactionType.GENESIS)
                txo.slpTransactionDetails.tokenIdHex = txo.txid;
            // apply initial SLP judgement to the UTXO (based on OP_RETURN parsing ONLY! Still need to validate the DAG for possible tokens and batons!)
            if (txo.slpTransactionDetails.transactionType === index_1.SlpTransactionType.GENESIS ||
                txo.slpTransactionDetails.transactionType === index_1.SlpTransactionType.MINT) {
                if (txo.slpTransactionDetails.containsBaton && txo.slpTransactionDetails.batonVout === txo.vout) {
                    txo.slpUtxoJudgement = index_1.SlpUtxoJudgement.SLP_BATON;
                }
                else if (txo.vout === 1 && txo.slpTransactionDetails.genesisOrMintQuantity.isGreaterThan(0)) {
                    txo.slpUtxoJudgement = index_1.SlpUtxoJudgement.SLP_TOKEN;
                    txo.slpUtxoJudgementAmount = txo.slpTransactionDetails.genesisOrMintQuantity;
                }
                else
                    txo.slpUtxoJudgement = index_1.SlpUtxoJudgement.NOT_SLP;
            }
            else if (txo.slpTransactionDetails.transactionType === index_1.SlpTransactionType.SEND && txo.slpTransactionDetails.sendOutputs) {
                if (txo.vout > 0 && txo.vout < txo.slpTransactionDetails.sendOutputs.length) {
                    txo.slpUtxoJudgement = index_1.SlpUtxoJudgement.SLP_TOKEN;
                    txo.slpUtxoJudgementAmount = txo.slpTransactionDetails.sendOutputs[txo.vout];
                }
                else
                    txo.slpUtxoJudgement = index_1.SlpUtxoJudgement.NOT_SLP;
            }
            else {
                txo.slpUtxoJudgement = index_1.SlpUtxoJudgement.NOT_SLP;
            }
        }
        catch (e) {
            // any errors in parsing SLP OP_RETURN means the TXN is NOT SLP.
            txo.slpUtxoJudgement = index_1.SlpUtxoJudgement.NOT_SLP;
        }
    };
    Slp.prototype.applyFinalSlpJudgement = function (asyncSlpValidator, utxos) {
        return __awaiter(this, void 0, void 0, function () {
            var validSLPTx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, asyncSlpValidator.validateSlpTransactions(__spread(new Set(utxos.filter(function (txOut) {
                            if (txOut.slpTransactionDetails &&
                                txOut.slpUtxoJudgement !== index_1.SlpUtxoJudgement.UNKNOWN &&
                                txOut.slpUtxoJudgement !== index_1.SlpUtxoJudgement.NOT_SLP)
                                return true;
                            return false;
                        }).map(function (txOut) { return txOut.txid; }))))];
                    case 1:
                        validSLPTx = _a.sent();
                        utxos.forEach(function (utxo) {
                            if (!(validSLPTx.includes(utxo.txid))) {
                                if (utxo.slpUtxoJudgement === index_1.SlpUtxoJudgement.SLP_TOKEN) {
                                    utxo.slpUtxoJudgement = index_1.SlpUtxoJudgement.INVALID_TOKEN_DAG;
                                }
                                else if (utxo.slpUtxoJudgement === index_1.SlpUtxoJudgement.SLP_BATON) {
                                    utxo.slpUtxoJudgement = index_1.SlpUtxoJudgement.INVALID_BATON_DAG;
                                }
                            }
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    return Slp;
}());
exports.Slp = Slp;
//# sourceMappingURL=slp.js.map