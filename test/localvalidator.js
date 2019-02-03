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
const bitbox_sdk_1 = require("bitbox-sdk/lib/bitbox-sdk");
const BITBOX = new bitbox_sdk_1.default();
const assert = require("assert");
require("mocha");
const localvalidator_1 = require("../lib/localvalidator");
const txUnitTestData = require('slp-unit-test-data/tx_input_tests.json');
describe('Slp', function () {
    describe('isValidSlpTxid() -- SLP Transaction Validation Unit Tests', function () {
        txUnitTestData.forEach(test => {
            it(test.description, () => __awaiter(this, void 0, void 0, function* () {
                let getRawUnitTestTransactions = (txids) => __awaiter(this, void 0, void 0, function* () {
                    let allTxns = test.when.concat(test.should);
                    let txn = allTxns.find(i => {
                        let hash = BITBOX.Crypto.sha256(BITBOX.Crypto.sha256(Buffer.from(i.tx, 'hex'))).reverse().toString('hex');
                        return hash === txids[0];
                    });
                    if (txn)
                        return [txn.tx];
                    return null;
                });
                const slpValidator = new localvalidator_1.LocalValidator(BITBOX, getRawUnitTestTransactions);
                test.when.forEach(w => slpValidator.addValidationFromStore(w.tx, w.valid));
                let txid = BITBOX.Crypto.sha256(BITBOX.Crypto.sha256(Buffer.from(test.should[0].tx, 'hex'))).reverse().toString('hex');
                let shouldBeValid = test.should[0].valid;
                let isValid = yield slpValidator.isValidSlpTxid(txid);
                assert.equal(isValid, shouldBeValid);
            }));
        });
    });
});
//# sourceMappingURL=localvalidator.js.map