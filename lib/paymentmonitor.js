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
Object.defineProperty(exports, "__esModule", { value: true });
var bchaddr = require("bchaddrjs-slp");
var bignumber_js_1 = require("bignumber.js");
var sleep = function (ms) { return new Promise(function (resolve) { return setTimeout(resolve, ms); }); };
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["NOT_MONITORING"] = "NOT_MONITORING";
    PaymentStatus["WAITING_FOR_PAYMENT"] = "WAITING_FOR_PAYMENT";
    PaymentStatus["PAYMENT_TOO_LOW"] = "PAYMENT_TOO_LOW";
    PaymentStatus["PAYMENT_SUCCESS"] = "PAYMENT_SUCCESS";
    PaymentStatus["PAYMENT_CANCELLED"] = "PAYMENT_CANCELLED";
    PaymentStatus["ERROR"] = "ERROR";
})(PaymentStatus = exports.PaymentStatus || (exports.PaymentStatus = {}));
var PaymentMonitor = /** @class */ (function () {
    //paymentTokenId?: string;
    //paymentSlpSatoshis?: BigNumber;
    function PaymentMonitor(getUtxos, statusChangeCallback) {
        this.addressUtxoResult = null;
        this.bchPaymentStatus = PaymentStatus.NOT_MONITORING;
        this.slpPaymentStatus = PaymentStatus.NOT_MONITORING;
        this.bchSatoshisReceived = 0;
        this.slpSatoshisReceived = new bignumber_js_1.default(0);
        this.getUtxos = getUtxos;
        this.statusChangeCallback = statusChangeCallback;
    }
    PaymentMonitor.prototype.cancelPayment = function () {
        this._changeBchPaymentStatus(PaymentStatus.PAYMENT_CANCELLED);
    };
    PaymentMonitor.prototype._changeBchPaymentStatus = function (newStatus) {
        if (this.bchPaymentStatus === newStatus) {
            this._changeBchPaymentStatus(PaymentStatus.ERROR);
            throw Error("Already monitoring for a payment, status cannot be changed to the same state");
        }
        this.bchPaymentStatus = newStatus;
        if (this.statusChangeCallback)
            this.statusChangeCallback(this.addressUtxoResult, this.bchPaymentStatus);
    };
    PaymentMonitor.prototype.monitorForBchPayment = function (address, paymentSatoshis) {
        return __awaiter(this, void 0, void 0, function () {
            var result, ex_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.addressUtxoResult = null;
                        this._changeBchPaymentStatus(PaymentStatus.WAITING_FOR_PAYMENT);
                        this.paymentAddress = address;
                        this.paymentSatoshis = paymentSatoshis;
                        // must be a cash or legacy addr
                        if (!bchaddr.isCashAddress(this.paymentAddress) && !bchaddr.isLegacyAddress(this.paymentAddress))
                            throw new Error("Not an a valid address format, must be cashAddr or Legacy address format.");
                        _a.label = 1;
                    case 1:
                        if (!(this.bchPaymentStatus === PaymentStatus.WAITING_FOR_PAYMENT)) return [3 /*break*/, 7];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.getUtxos(address)];
                    case 3:
                        result = _a.sent();
                        if (result) {
                            this.bchSatoshisReceived = result.utxos.reduce(function (t, v) { return t += v.satoshis; }, 0);
                            if (result.utxos.reduce(function (t, v) { return t += v.satoshis; }, 0) >= paymentSatoshis) {
                                this.addressUtxoResult = result;
                                this._changeBchPaymentStatus(PaymentStatus.PAYMENT_SUCCESS);
                                return [3 /*break*/, 7];
                            }
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        ex_1 = _a.sent();
                        console.log(ex_1);
                        return [3 /*break*/, 5];
                    case 5: return [4 /*yield*/, sleep(1000)];
                    case 6:
                        _a.sent();
                        return [3 /*break*/, 1];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    return PaymentMonitor;
}());
exports.PaymentMonitor = PaymentMonitor;
//# sourceMappingURL=paymentmonitor.js.map