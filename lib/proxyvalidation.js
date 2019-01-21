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
const axios_1 = require("axios");
class ProxyValidation {
    constructor(proxyUrl = 'https://validate.simpleledger.info') {
        this.proxyUrl = proxyUrl;
    }
    isValidSlpTxid(txid) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield axios_1.default({
                method: "post",
                url: this.proxyUrl,
                data: {
                    jsonrpc: "2.0",
                    id: "slpvalidate",
                    method: "slpvalidate",
                    params: [txid, false, false]
                }
            });
            if (result && result.data && result.data.result === "Valid") {
                return true;
            }
            else {
                return false;
            }
        });
    }
    validateTransactions(txIds) {
        return __awaiter(this, void 0, void 0, function* () {
            // Validate each txid
            const validatePromises = txIds.map((txid) => __awaiter(this, void 0, void 0, function* () {
                const isValid = yield this.isValidSlpTxid(txid);
                return isValid ? txid : '';
            }));
            // Filter array to only valid txid results
            const validateResults = yield axios_1.default.all(validatePromises);
            return validateResults.filter((result) => result.length > 0);
        });
    }
}
exports.ProxyValidation = ProxyValidation;
