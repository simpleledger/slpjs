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
var Bitcore = require("bitcore-lib-cash");
var bignumber_js_1 = require("bignumber.js");
var sleep = function (ms) { return new Promise(function (resolve) { return setTimeout(resolve, ms); }); };
var LocalValidator = /** @class */ (function () {
    function LocalValidator(BITBOX, getRawTransactions, logger) {
        this.logger = { log: function (s) { return null; } };
        if (!BITBOX)
            throw Error("Must provide BITBOX instance to class constructor.");
        if (!getRawTransactions)
            throw Error("Must provide method getRawTransactions to class constructor.");
        if (logger)
            this.logger = logger;
        this.BITBOX = BITBOX;
        this.getRawTransactions = getRawTransactions;
        this.slp = new slp_1.Slp(BITBOX);
        this.cachedValidations = {};
        this.cachedRawTransactions = {};
    }
    LocalValidator.prototype.addValidationFromStore = function (hex, isValid) {
        var id = this.BITBOX.Crypto.sha256(this.BITBOX.Crypto.sha256(Buffer.from(hex, 'hex'))).reverse().toString('hex');
        if (!this.cachedValidations[id])
            this.cachedValidations[id] = { validity: isValid, parents: [], details: null, invalidReason: null };
        if (!this.cachedRawTransactions[id])
            this.cachedRawTransactions[id] = hex;
    };
    LocalValidator.prototype.waitForCurrentValidationProcessing = function (txid) {
        return __awaiter(this, void 0, void 0, function () {
            var cached;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cached = this.cachedValidations[txid];
                        _a.label = 1;
                    case 1:
                        if (!true) return [3 /*break*/, 3];
                        if (typeof cached.validity === 'boolean')
                            return [3 /*break*/, 3];
                        return [4 /*yield*/, sleep(10)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 1];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    LocalValidator.prototype.waitForTransactionPreProcessing = function (txid) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!true) return [3 /*break*/, 2];
                        if (this.cachedRawTransactions[txid] && (this.cachedValidations[txid].details || typeof this.cachedValidations.validity === 'boolean'))
                            return [3 /*break*/, 2];
                        return [4 /*yield*/, sleep(10)];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 0];
                    case 2: 
                    //await sleep(100); // short wait to make sure parent's properties gets set first.
                    return [2 /*return*/];
                }
            });
        });
    };
    LocalValidator.prototype.retrieveRawTransaction = function (txid) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b, re;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (this.cachedRawTransactions[txid])
                            return [2 /*return*/, this.cachedRawTransactions[txid]];
                        _a = this.cachedRawTransactions;
                        _b = txid;
                        return [4 /*yield*/, this.getRawTransactions([txid])];
                    case 1:
                        _a[_b] = (_c.sent())[0];
                        if (this.cachedRawTransactions[txid]) {
                            re = /^([A-Fa-f0-9]{2}){60,}$/;
                            if (!re.test(this.cachedRawTransactions[txid]))
                                throw Error("Transaction data not provided (regex failed).");
                            return [2 /*return*/, this.cachedRawTransactions[txid]];
                        }
                        throw Error("Transaction data not provided (null or undefined).");
                }
            });
        });
    };
    LocalValidator.prototype.isValidSlpTxid = function (txid, tokenIdFilter) {
        return __awaiter(this, void 0, void 0, function () {
            var valid;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger.log("SLPJS Validating: " + txid);
                        return [4 /*yield*/, this._isValidSlpTxid(txid, tokenIdFilter)];
                    case 1:
                        valid = _a.sent();
                        this.logger.log("SLPJS Result: " + valid + " (" + txid + ")");
                        if (!valid && this.cachedValidations[txid].invalidReason)
                            this.logger.log("SLPJS Invalid Reason: " + this.cachedValidations[txid].invalidReason);
                        else if (!valid)
                            this.logger.log("SLPJS Invalid Reason: unknown (result is user supplied)");
                        return [2 /*return*/, valid];
                }
            });
        });
    };
    LocalValidator.prototype._isValidSlpTxid = function (txid, tokenIdFilter) {
        return __awaiter(this, void 0, void 0, function () {
            var txn, slpmsg, i, input_txid, input_txhex, input_tx, input_slpmsg, tokenOutQty, tokenInQty, i, input_txid, input_txhex, input_tx, input_slpmsg, parentTxids, _loop_1, this_1, i, state_1, validInputQty, tokenOutQty, validVersionType;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!this.cachedValidations[txid]) return [3 /*break*/, 2];
                        this.cachedValidations[txid] = { validity: null, parents: [], details: null, invalidReason: null };
                        return [4 /*yield*/, this.retrieveRawTransaction(txid)];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        if (typeof this.cachedValidations[txid].validity === 'boolean')
                            return [2 /*return*/, this.cachedValidations[txid].validity];
                        _a.label = 3;
                    case 3:
                        if (!!this.cachedRawTransactions[txid]) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.waitForTransactionPreProcessing(txid)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        if (!this.cachedValidations[txid].details) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.waitForCurrentValidationProcessing(txid)];
                    case 6:
                        _a.sent();
                        _a.label = 7;
                    case 7:
                        txn = new Bitcore.Transaction(this.cachedRawTransactions[txid]);
                        try {
                            slpmsg = this.cachedValidations[txid].details = this.slp.parseSlpOutputScript(txn.outputs[0]._scriptBuffer);
                            if (slpmsg.transactionType === index_1.SlpTransactionType.GENESIS)
                                slpmsg.tokenIdHex = txid;
                        }
                        catch (e) {
                            this.cachedValidations[txid].invalidReason = "SLP OP_RETURN parsing error (" + e.message + ").";
                            return [2 /*return*/, this.cachedValidations[txid].validity = false];
                        }
                        // Check for tokenId filter
                        if (tokenIdFilter && slpmsg.tokenIdHex !== tokenIdFilter) {
                            this.cachedValidations[txid].invalidReason = "Only tokenId " + tokenIdFilter + " was considered by validator.";
                            return [2 /*return*/, this.cachedValidations[txid].validity = false];
                        }
                        if (!(slpmsg.transactionType === index_1.SlpTransactionType.GENESIS)) return [3 /*break*/, 8];
                        return [2 /*return*/, this.cachedValidations[txid].validity = true];
                    case 8:
                        if (!(slpmsg.transactionType === index_1.SlpTransactionType.MINT)) return [3 /*break*/, 13];
                        i = 0;
                        _a.label = 9;
                    case 9:
                        if (!(i < txn.inputs.length)) return [3 /*break*/, 12];
                        input_txid = txn.inputs[i].prevTxId.toString('hex');
                        return [4 /*yield*/, this.retrieveRawTransaction(input_txid)];
                    case 10:
                        input_txhex = _a.sent();
                        input_tx = new Bitcore.Transaction(input_txhex);
                        try {
                            input_slpmsg = this.slp.parseSlpOutputScript(input_tx.outputs[0]._scriptBuffer);
                            if (input_slpmsg.transactionType === index_1.SlpTransactionType.GENESIS)
                                input_slpmsg.tokenIdHex = input_txid;
                            if (input_slpmsg.tokenIdHex === slpmsg.tokenIdHex) {
                                if (input_slpmsg.transactionType === index_1.SlpTransactionType.GENESIS || input_slpmsg.transactionType === index_1.SlpTransactionType.MINT) {
                                    if (txn.inputs[i].outputIndex === input_slpmsg.batonVout) {
                                        this.cachedValidations[txid].parents.push({
                                            txid: txn.inputs[i].prevTxId.toString('hex'),
                                            vout: txn.inputs[i].outputIndex,
                                            versionType: input_slpmsg.versionType,
                                            valid: null,
                                            inputQty: null
                                        });
                                    }
                                }
                            }
                        }
                        catch (_) { }
                        _a.label = 11;
                    case 11:
                        i++;
                        return [3 /*break*/, 9];
                    case 12:
                        if (this.cachedValidations[txid].parents.length !== 1) {
                            this.cachedValidations[txid].invalidReason = "MINT transaction must have 1 valid baton parent.";
                            return [2 /*return*/, this.cachedValidations[txid].validity = false];
                        }
                        return [3 /*break*/, 18];
                    case 13:
                        if (!(slpmsg.transactionType === index_1.SlpTransactionType.SEND)) return [3 /*break*/, 18];
                        tokenOutQty = slpmsg.sendOutputs.reduce(function (t, v) { return t.plus(v); }, new bignumber_js_1.default(0));
                        tokenInQty = new bignumber_js_1.default(0);
                        i = 0;
                        _a.label = 14;
                    case 14:
                        if (!(i < txn.inputs.length)) return [3 /*break*/, 17];
                        input_txid = txn.inputs[i].prevTxId.toString('hex');
                        return [4 /*yield*/, this.retrieveRawTransaction(input_txid)];
                    case 15:
                        input_txhex = _a.sent();
                        input_tx = new Bitcore.Transaction(input_txhex);
                        try {
                            input_slpmsg = this.slp.parseSlpOutputScript(input_tx.outputs[0]._scriptBuffer);
                            if (input_slpmsg.transactionType === index_1.SlpTransactionType.GENESIS)
                                input_slpmsg.tokenIdHex = input_txid;
                            if (input_slpmsg.tokenIdHex === slpmsg.tokenIdHex) {
                                if (input_slpmsg.transactionType === index_1.SlpTransactionType.SEND) {
                                    if (txn.inputs[i].outputIndex <= input_slpmsg.sendOutputs.length - 1) {
                                        tokenInQty = tokenInQty.plus(input_slpmsg.sendOutputs[txn.inputs[i].outputIndex]);
                                        this.cachedValidations[txid].parents.push({
                                            txid: txn.inputs[i].prevTxId.toString('hex'),
                                            vout: txn.inputs[i].outputIndex,
                                            versionType: input_slpmsg.versionType,
                                            valid: null,
                                            inputQty: input_slpmsg.sendOutputs[txn.inputs[i].outputIndex]
                                        });
                                    }
                                }
                                else if (input_slpmsg.transactionType === index_1.SlpTransactionType.GENESIS || input_slpmsg.transactionType === index_1.SlpTransactionType.MINT) {
                                    if (txn.inputs[i].outputIndex === 1) {
                                        tokenInQty = tokenInQty.plus(input_slpmsg.genesisOrMintQuantity);
                                        this.cachedValidations[txid].parents.push({
                                            txid: txn.inputs[i].prevTxId.toString('hex'),
                                            vout: txn.inputs[i].outputIndex,
                                            versionType: input_slpmsg.versionType,
                                            valid: null,
                                            inputQty: input_slpmsg.genesisOrMintQuantity
                                        });
                                    }
                                }
                            }
                        }
                        catch (_) { }
                        _a.label = 16;
                    case 16:
                        i++;
                        return [3 /*break*/, 14];
                    case 17:
                        // Check token inputs are greater than token outputs (includes valid and invalid inputs)
                        if (tokenOutQty.isGreaterThan(tokenInQty)) {
                            this.cachedValidations[txid].invalidReason = "Token outputs are greater than possible token inputs.";
                            return [2 /*return*/, this.cachedValidations[txid].validity = false];
                        }
                        _a.label = 18;
                    case 18:
                        parentTxids = __spread(new Set(this.cachedValidations[txid].parents.map(function (p) { return p.txid; })));
                        _loop_1 = function (i) {
                            var valid;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this_1.isValidSlpTxid(parentTxids[i])];
                                    case 1:
                                        valid = _a.sent();
                                        this_1.cachedValidations[txid].parents.filter(function (p) { return p.txid === parentTxids[i]; }).map(function (p) { return p.valid = valid; });
                                        if (this_1.cachedValidations[txid].details.transactionType === index_1.SlpTransactionType.MINT && !valid) {
                                            this_1.cachedValidations[txid].invalidReason = "MINT transaction with invalid baton parent.";
                                            return [2 /*return*/, { value: this_1.cachedValidations[txid].validity = false }];
                                        }
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        i = 0;
                        _a.label = 19;
                    case 19:
                        if (!(i < parentTxids.length)) return [3 /*break*/, 22];
                        return [5 /*yield**/, _loop_1(i)];
                    case 20:
                        state_1 = _a.sent();
                        if (typeof state_1 === "object")
                            return [2 /*return*/, state_1.value];
                        _a.label = 21;
                    case 21:
                        i++;
                        return [3 /*break*/, 19];
                    case 22:
                        // Check valid inputs are greater than token outputs
                        if (this.cachedValidations[txid].details.transactionType === index_1.SlpTransactionType.SEND) {
                            validInputQty = this.cachedValidations[txid].parents.reduce(function (t, v) { return v.valid ? t.plus(v.inputQty) : t; }, new bignumber_js_1.default(0));
                            tokenOutQty = slpmsg.sendOutputs.reduce(function (t, v) { return t.plus(v); }, new bignumber_js_1.default(0));
                            if (tokenOutQty.isGreaterThan(validInputQty)) {
                                this.cachedValidations[txid].invalidReason = "Token outputs are greater than valid token inputs.";
                                return [2 /*return*/, this.cachedValidations[txid].validity = false];
                            }
                        }
                        // Check versionType is not different from valid parents
                        if (this.cachedValidations[txid].parents.filter(function (p) { return p.valid; }).length > 0) {
                            validVersionType = this.cachedValidations[txid].parents.find(function (p) { return p.valid; }).versionType;
                            if (this.cachedValidations[txid].details.versionType !== validVersionType) {
                                this.cachedValidations[txid].invalidReason = "SLP version/type mismatch from valid parent.";
                                return [2 /*return*/, this.cachedValidations[txid].validity = false];
                            }
                        }
                        return [2 /*return*/, this.cachedValidations[txid].validity = true];
                }
            });
        });
    };
    LocalValidator.prototype.validateSlpTransactions = function (txids) {
        return __awaiter(this, void 0, void 0, function () {
            var res, i, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        res = [];
                        i = 0;
                        _c.label = 1;
                    case 1:
                        if (!(i < txids.length)) return [3 /*break*/, 4];
                        _b = (_a = res).push;
                        return [4 /*yield*/, this.isValidSlpTxid(txids[i])];
                    case 2:
                        _b.apply(_a, [(_c.sent()) ? txids[i] : '']);
                        _c.label = 3;
                    case 3:
                        i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, res.filter(function (id) { return id.length > 0; })];
                }
            });
        });
    };
    return LocalValidator;
}());
exports.LocalValidator = LocalValidator;
//# sourceMappingURL=localvalidator.js.map