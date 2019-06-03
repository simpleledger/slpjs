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
var slp_1 = require("./slp");
var utils_1 = require("./utils");
var _ = require("lodash");
var Bitcore = require("bitcore-lib-cash");
var axios_1 = require("axios");
var transactionhelpers_1 = require("./transactionhelpers");
var paymentmonitor_1 = require("./paymentmonitor");
var sleep = function (ms) { return new Promise(function (resolve) { return setTimeout(resolve, ms); }); };
var BitboxNetwork = /** @class */ (function () {
    function BitboxNetwork(BITBOX, validator, logger) {
        this.logger = { log: function (s) { return null; } };
        if (!BITBOX)
            throw Error("Must provide BITBOX instance to class constructor.");
        if (logger)
            this.logger = logger;
        if (validator)
            this.validator = validator;
        this.BITBOX = BITBOX;
        this.slp = new slp_1.Slp(BITBOX);
        this.txnHelpers = new transactionhelpers_1.TransactionHelpers(this.slp);
    }
    BitboxNetwork.prototype.getTokenInformation = function (txid, decimalConversion) {
        if (decimalConversion === void 0) { decimalConversion = false; }
        return __awaiter(this, void 0, void 0, function () {
            var res, e_1, txhex, txn, slpMsg;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.BITBOX.RawTransactions.getRawTransaction([txid])];
                    case 1:
                        res = (_a.sent());
                        return [3 /*break*/, 3];
                    case 2:
                        e_1 = _a.sent();
                        throw Error(e_1.error);
                    case 3:
                        if (!Array.isArray(res) || res.length !== 1)
                            throw Error("BITBOX response error for 'RawTransactions.getRawTransaction'");
                        txhex = res[0];
                        txn = new Bitcore.Transaction(txhex);
                        slpMsg = this.slp.parseSlpOutputScript(txn.outputs[0]._scriptBuffer);
                        if (slpMsg.transactionType === index_1.SlpTransactionType.GENESIS) {
                            slpMsg.tokenIdHex = txid;
                            if (decimalConversion)
                                slpMsg.genesisOrMintQuantity = slpMsg.genesisOrMintQuantity.dividedBy(Math.pow(10, slpMsg.decimals));
                        }
                        else {
                            if (decimalConversion)
                                slpMsg.sendOutputs.map(function (o) { return o.dividedBy(Math.pow(10, slpMsg.decimals)); });
                        }
                        return [2 /*return*/, slpMsg];
                }
            });
        });
    };
    // WARNING: this method is limited to 60 transactions per minute
    BitboxNetwork.prototype.getTransactionDetails = function (txid, decimalConversion) {
        if (decimalConversion === void 0) { decimalConversion = false; }
        return __awaiter(this, void 0, void 0, function () {
            var txn, _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0: return [4 /*yield*/, this.BITBOX.Transaction.details([txid])];
                    case 1:
                        txn = (_d.sent())[0];
                        // add slp address format to transaction details
                        txn.vin.forEach(function (input) {
                            try {
                                input.slpAddress = utils_1.Utils.toSlpAddress(input.legacyAddress);
                            }
                            catch (_) { }
                        });
                        txn.vout.forEach(function (output) {
                            try {
                                output.scriptPubKey.slpAddrs = [utils_1.Utils.toSlpAddress(output.scriptPubKey.cashAddrs[0])];
                            }
                            catch (_) { }
                        });
                        // add token information to transaction details
                        _a = txn;
                        return [4 /*yield*/, this.getTokenInformation(txid, decimalConversion)];
                    case 2:
                        // add token information to transaction details
                        _a.tokenInfo = _d.sent();
                        _b = txn;
                        if (!this.validator) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.validator.isValidSlpTxid(txid, null, this.logger)];
                    case 3:
                        _c = _d.sent();
                        return [3 /*break*/, 6];
                    case 4: return [4 /*yield*/, this.isValidSlpTxid(txid)];
                    case 5:
                        _c = _d.sent();
                        _d.label = 6;
                    case 6:
                        _b.tokenIsValid = _c;
                        return [2 /*return*/, txn];
                }
            });
        });
    };
    BitboxNetwork.prototype.getUtxos = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!utils_1.Utils.isCashAddress(address) && !utils_1.Utils.isLegacyAddress(address))
                            address = utils_1.Utils.toCashAddress(address);
                        return [4 /*yield*/, this.BITBOX.Address.utxo([address])];
                    case 1:
                        //throw new Error("Not an a valid address format, must be cashAddr or Legacy address format.");
                        res = (_a.sent())[0];
                        return [2 /*return*/, res];
                }
            });
        });
    };
    BitboxNetwork.prototype.getAllSlpBalancesAndUtxos = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var result, results, i, utxos, _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        if (!(typeof address === "string")) return [3 /*break*/, 3];
                        address = utils_1.Utils.toCashAddress(address);
                        return [4 /*yield*/, this.getUtxoWithTxDetails(address)];
                    case 1:
                        result = _d.sent();
                        return [4 /*yield*/, this.processUtxosForSlp(result)];
                    case 2: return [2 /*return*/, _d.sent()];
                    case 3:
                        address = address.map(function (a) { return utils_1.Utils.toCashAddress(a); });
                        results = [];
                        i = 0;
                        _d.label = 4;
                    case 4:
                        if (!(i < address.length)) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.getUtxoWithTxDetails(address[i])];
                    case 5:
                        utxos = _d.sent();
                        _b = (_a = results).push;
                        _c = { address: utils_1.Utils.toSlpAddress(address[i]) };
                        return [4 /*yield*/, this.processUtxosForSlp(utxos)];
                    case 6:
                        _b.apply(_a, [(_c.result = _d.sent(), _c)]);
                        _d.label = 7;
                    case 7:
                        i++;
                        return [3 /*break*/, 4];
                    case 8: return [2 /*return*/, results];
                }
            });
        });
    };
    // Sent SLP tokens to a single output address with change handled (Warning: Sweeps all BCH/SLP UTXOs for the funding address)
    BitboxNetwork.prototype.simpleTokenSend = function (tokenId, sendAmounts, inputUtxos, tokenReceiverAddresses, changeReceiverAddress, requiredNonTokenOutputs) {
        if (requiredNonTokenOutputs === void 0) { requiredNonTokenOutputs = []; }
        return __awaiter(this, void 0, void 0, function () {
            var txHex;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        txHex = this.txnHelpers.simpleTokenSend(tokenId, sendAmounts, inputUtxos, tokenReceiverAddresses, changeReceiverAddress, requiredNonTokenOutputs);
                        if (!inputUtxos.every(function (i) { return typeof i.wif === "string"; }))
                            throw Error("The BitboxNetwork version of this method requires a private key WIF be provided with each input.  If you want more control over the signing process use Slp.simpleTokenSend() to get the unsigned transaction, then after the transaction is signed you can use BitboxNetwork.sendTx()");
                        return [4 /*yield*/, this.sendTx(txHex)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    BitboxNetwork.prototype.simpleBchSend = function (sendAmounts, inputUtxos, bchReceiverAddresses, changeReceiverAddress) {
        return __awaiter(this, void 0, void 0, function () {
            var genesisTxHex;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        genesisTxHex = this.txnHelpers.simpleBchSend(sendAmounts, inputUtxos, bchReceiverAddresses, changeReceiverAddress);
                        return [4 /*yield*/, this.sendTx(genesisTxHex)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    BitboxNetwork.prototype.simpleNFT1Genesis = function (tokenName, tokenTicker, parentTokenIdHex, tokenReceiverAddress, bchChangeReceiverAddress, inputUtxos) {
        return __awaiter(this, void 0, void 0, function () {
            var genesisTxHex;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        genesisTxHex = this.txnHelpers.simpleNFT1Genesis(tokenName, tokenTicker, parentTokenIdHex, tokenReceiverAddress, bchChangeReceiverAddress, inputUtxos);
                        return [4 /*yield*/, this.sendTx(genesisTxHex)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    BitboxNetwork.prototype.simpleTokenGenesis = function (tokenName, tokenTicker, tokenAmount, documentUri, documentHash, decimals, tokenReceiverAddress, batonReceiverAddress, bchChangeReceiverAddress, inputUtxos) {
        return __awaiter(this, void 0, void 0, function () {
            var genesisTxHex;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        genesisTxHex = this.txnHelpers.simpleTokenGenesis(tokenName, tokenTicker, tokenAmount, documentUri, documentHash, decimals, tokenReceiverAddress, batonReceiverAddress, bchChangeReceiverAddress, inputUtxos);
                        return [4 /*yield*/, this.sendTx(genesisTxHex)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // Sent SLP tokens to a single output address with change handled (Warning: Sweeps all BCH/SLP UTXOs for the funding address)
    BitboxNetwork.prototype.simpleTokenMint = function (tokenId, mintAmount, inputUtxos, tokenReceiverAddress, batonReceiverAddress, changeReceiverAddress) {
        return __awaiter(this, void 0, void 0, function () {
            var txHex;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        txHex = this.txnHelpers.simpleTokenMint(tokenId, mintAmount, inputUtxos, tokenReceiverAddress, batonReceiverAddress, changeReceiverAddress);
                        return [4 /*yield*/, this.sendTx(txHex)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // Burn a precise quantity of SLP tokens with remaining tokens (change) sent to a single output address (Warning: Sweeps all BCH/SLP UTXOs for the funding address)
    BitboxNetwork.prototype.simpleTokenBurn = function (tokenId, burnAmount, inputUtxos, changeReceiverAddress) {
        return __awaiter(this, void 0, void 0, function () {
            var txHex;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        txHex = this.txnHelpers.simpleTokenBurn(tokenId, burnAmount, inputUtxos, changeReceiverAddress);
                        return [4 /*yield*/, this.sendTx(txHex)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    BitboxNetwork.prototype.getUtxoWithRetry = function (address, retries) {
        if (retries === void 0) { retries = 40; }
        return __awaiter(this, void 0, void 0, function () {
            var result, count;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        count = 0;
                        _a.label = 1;
                    case 1:
                        if (!(result === undefined)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.getUtxos(address)];
                    case 2:
                        result = _a.sent();
                        count++;
                        if (count > retries)
                            throw new Error("this.BITBOX.Address.utxo endpoint experienced a problem");
                        return [4 /*yield*/, sleep(250)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, result];
                }
            });
        });
    };
    BitboxNetwork.prototype.getUtxoWithTxDetails = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var utxos, _a, _b, txIds, txDetails;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _b = (_a = utils_1.Utils).mapToSlpAddressUtxoResultArray;
                        return [4 /*yield*/, this.getUtxoWithRetry(address)];
                    case 1:
                        utxos = _b.apply(_a, [_c.sent()]);
                        txIds = utxos.map(function (i) { return i.txid; });
                        if (txIds.length === 0)
                            return [2 /*return*/, []];
                        return [4 /*yield*/, Promise.all(_.chunk(txIds, 20).map(function (txids) {
                                return _this.getTransactionDetailsWithRetry(__spread(new Set(txids)));
                            }))];
                    case 2:
                        txDetails = (_c.sent());
                        // concat the chunked arrays
                        txDetails = [].concat.apply([], __spread(txDetails));
                        utxos = utxos.map(function (i) { i.tx = txDetails.find(function (d) { return d.txid === i.txid; }); return i; });
                        return [2 /*return*/, utxos];
                }
            });
        });
    };
    BitboxNetwork.prototype.getTransactionDetailsWithRetry = function (txids, retries) {
        if (retries === void 0) { retries = 40; }
        return __awaiter(this, void 0, void 0, function () {
            var result, count;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        count = 0;
                        _a.label = 1;
                    case 1:
                        if (!(result === undefined)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.BITBOX.Transaction.details(txids)];
                    case 2:
                        result = (_a.sent());
                        if (result)
                            return [2 /*return*/, result];
                        count++;
                        if (count > retries)
                            throw new Error("this.BITBOX.Address.details endpoint experienced a problem");
                        return [4 /*yield*/, sleep(250)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    BitboxNetwork.prototype.getAddressDetailsWithRetry = function (address, retries) {
        if (retries === void 0) { retries = 40; }
        return __awaiter(this, void 0, void 0, function () {
            var result, count;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // must be a cash or legacy addr
                        if (!utils_1.Utils.isCashAddress(address) && !utils_1.Utils.isLegacyAddress(address))
                            throw new Error("Not an a valid address format, must be cashAddr or Legacy address format.");
                        count = 0;
                        _a.label = 1;
                    case 1:
                        if (!(result === undefined)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.BITBOX.Address.details([address])];
                    case 2:
                        result = (_a.sent());
                        if (result)
                            return [2 /*return*/, result];
                        count++;
                        if (count > retries)
                            throw new Error("this.BITBOX.Address.details endpoint experienced a problem");
                        return [4 /*yield*/, sleep(250)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    BitboxNetwork.prototype.sendTx = function (hex) {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.BITBOX.RawTransactions.sendRawTransaction([hex])];
                    case 1:
                        res = _a.sent();
                        //console.log(res);
                        if (typeof res === 'object') {
                            return [2 /*return*/, res[0]];
                        }
                        return [2 /*return*/, res];
                }
            });
        });
    };
    // Will be depreciated in version 0.19.0.
    BitboxNetwork.prototype.monitorForPayment = function (paymentAddress, fee, onPaymentCB) {
        return __awaiter(this, void 0, void 0, function () {
            var result, ex_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // must be a cash or legacy addr
                        if (!utils_1.Utils.isCashAddress(paymentAddress) && !utils_1.Utils.isLegacyAddress(paymentAddress))
                            throw new Error("Not an a valid address format, must be cashAddr or Legacy address format.");
                        _a.label = 1;
                    case 1:
                        if (!true) return [3 /*break*/, 7];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.getUtxos(paymentAddress)];
                    case 3:
                        result = _a.sent();
                        if (result)
                            if (result.utxos[0].satoshis >= fee)
                                return [3 /*break*/, 7];
                        return [3 /*break*/, 5];
                    case 4:
                        ex_1 = _a.sent();
                        console.log(ex_1);
                        return [3 /*break*/, 5];
                    case 5: return [4 /*yield*/, sleep(2000)];
                    case 6:
                        _a.sent();
                        return [3 /*break*/, 1];
                    case 7:
                        onPaymentCB();
                        return [2 /*return*/];
                }
            });
        });
    };
    BitboxNetwork.prototype.createNewPaymentMonitor = function (paymentAddress, fee, statusChangeCallback) {
        var monitor = new paymentmonitor_1.PaymentMonitor(this.getUtxos, statusChangeCallback);
        monitor.monitorForBchPayment(paymentAddress, fee);
        return monitor;
    };
    BitboxNetwork.prototype.getRawTransactions = function (txids) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.validator) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.validator.getRawTransactions(txids)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2: return [4 /*yield*/, this.BITBOX.RawTransactions.getRawTransaction(txids)];
                    case 3: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    BitboxNetwork.prototype.processUtxosForSlp = function (utxos) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.validator) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.slp.processUtxosForSlpAbstract(utxos, this.validator)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2: return [4 /*yield*/, this.slp.processUtxosForSlpAbstract(utxos, this)];
                    case 3: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    BitboxNetwork.prototype.isValidSlpTxid = function (txid) {
        return __awaiter(this, void 0, void 0, function () {
            var validatorUrl, result, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.validator) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.validator.isValidSlpTxid(txid, undefined, this.logger)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        validatorUrl = this.setRemoteValidatorUrl();
                        this.logger.log("SLPJS Validating (remote: " + validatorUrl + "): " + txid);
                        return [4 /*yield*/, axios_1.default({
                                method: "post",
                                url: validatorUrl,
                                data: {
                                    txids: [txid]
                                }
                            })];
                    case 3:
                        result = _a.sent();
                        res = false;
                        if (result && result.data)
                            res = result.data.filter(function (i) { return i.valid; }).length > 0 ? true : false;
                        this.logger.log("SLPJS Validator Result: " + res + " (remote: " + validatorUrl + "): " + txid);
                        return [2 /*return*/, res];
                }
            });
        });
    };
    BitboxNetwork.prototype.validateSlpTransactions = function (txids) {
        return __awaiter(this, void 0, void 0, function () {
            var validatorUrl, promises, results, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.validator) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.validator.validateSlpTransactions(txids)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        validatorUrl = this.setRemoteValidatorUrl();
                        promises = _.chunk(txids, 20).map(function (ids) { return axios_1.default({
                            method: "post",
                            url: validatorUrl,
                            data: {
                                txids: ids
                            }
                        }); });
                        return [4 /*yield*/, axios_1.default.all(promises)];
                    case 3:
                        results = _a.sent();
                        result = { data: [] };
                        results.forEach(function (res) {
                            if (res.data)
                                result.data = result.data.concat(res.data);
                        });
                        if (result && result.data)
                            return [2 /*return*/, result.data.filter(function (i) { return i.valid; }).map(function (i) { return i.txid; })];
                        return [2 /*return*/, []];
                }
            });
        });
    };
    BitboxNetwork.prototype.setRemoteValidatorUrl = function () {
        var validatorUrl = this.BITBOX.restURL.replace('v1', 'v2');
        validatorUrl = validatorUrl.concat('/slp/validateTxid');
        validatorUrl = validatorUrl.replace('//slp', '/slp');
        return validatorUrl;
    };
    return BitboxNetwork;
}());
exports.BitboxNetwork = BitboxNetwork;
//# sourceMappingURL=bitboxnetwork.js.map