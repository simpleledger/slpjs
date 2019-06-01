"use strict";
/// <reference path="./lib/vendors.d.ts"/>
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./lib/slp"));
__export(require("./lib/utils"));
__export(require("./lib/bitdbnetwork"));
__export(require("./lib/localvalidator"));
__export(require("./lib/bitboxnetwork"));
__export(require("./lib/transactionhelpers"));
__export(require("./lib/cashy"));
__export(require("./lib/paymentmonitor"));
var SlpTransactionType;
(function (SlpTransactionType) {
    SlpTransactionType["GENESIS"] = "GENESIS";
    SlpTransactionType["MINT"] = "MINT";
    SlpTransactionType["SEND"] = "SEND";
})(SlpTransactionType = exports.SlpTransactionType || (exports.SlpTransactionType = {}));
var SlpVersionType;
(function (SlpVersionType) {
    SlpVersionType[SlpVersionType["TokenVersionType1"] = 1] = "TokenVersionType1";
})(SlpVersionType = exports.SlpVersionType || (exports.SlpVersionType = {}));
// negative values are bad, 0 = NOT_SLP, positive values are a SLP (token or baton)
var SlpUtxoJudgement;
(function (SlpUtxoJudgement) {
    SlpUtxoJudgement["UNKNOWN"] = "UNKNOWN";
    SlpUtxoJudgement["INVALID_BATON_DAG"] = "INVALID_BATON_DAG";
    SlpUtxoJudgement["INVALID_TOKEN_DAG"] = "INVALID_TOKEN_DAG";
    SlpUtxoJudgement["NOT_SLP"] = "NOT_SLP";
    SlpUtxoJudgement["SLP_TOKEN"] = "SLP_TOKEN";
    SlpUtxoJudgement["SLP_BATON"] = "SLP_BATON";
})(SlpUtxoJudgement = exports.SlpUtxoJudgement || (exports.SlpUtxoJudgement = {}));
var SlpAddressUtxoResult = /** @class */ (function () {
    function SlpAddressUtxoResult() {
        this.slpUtxoJudgement = SlpUtxoJudgement.UNKNOWN;
    }
    return SlpAddressUtxoResult;
}());
exports.SlpAddressUtxoResult = SlpAddressUtxoResult;
//# sourceMappingURL=index.js.map