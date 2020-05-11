import { Crypto } from "../lib/crypto";
import { GetRawTransactionsAsync, LocalValidator } from "../lib/localvalidator";
import { SlpTestTxn, SlpValidityUnitTest } from "./global";

import * as assert from "assert";
import { BITBOX } from "bitbox-sdk";
import "mocha";

const bitbox = new BITBOX();
const txUnitTestData: SlpValidityUnitTest[] = require("slp-unit-test-data/tx_input_tests.json");

describe("Slp", () => {
    describe("isValidSlpTxid() -- SLP Transaction Validation Unit Tests", () => {
        txUnitTestData.forEach((test) => {
            it(test.description, async () => {

                // Create method for serving up the unit test transactions
                const getRawUnitTestTransactions: GetRawTransactionsAsync = async (txids: string[]) => {
                    const allTxns: SlpTestTxn[] = test.when.concat(test.should);
                    const txn = allTxns.find((i) => {
                        const hash = Crypto.txid(Buffer.from(i.tx, "hex")).toString("hex");
                        return hash === txids[0];
                    });
                    if (txn) {
                        return [txn.tx];
                    }
                    throw Error("Transaction data for the provided txid not found (txid: " + txids[0] + ")");
                };

                // Create instance of Local Validator
                let slpValidator = new LocalValidator(bitbox, getRawUnitTestTransactions);

                // Pre-Load Validator the unit-test inputs
                test.when.forEach((w) => {
                    slpValidator.addValidationFromStore(w.tx, w.valid);
                });

                const txid = Crypto.txid(Buffer.from(test.should[0].tx, "hex")).toString("hex");
                const shouldBeValid = test.should[0].valid;
                let isValid;
                try {
                    isValid = await slpValidator.isValidSlpTxid(txid);
                } catch (error) {
                    if (error.message.includes("Transaction data for the provided txid not found") &&
                    test.allow_inconclusive && test.inconclusive_reason === "missing-txn") {
                        isValid = false;
                    } else {
                        throw error;
                    }
                }

                if (isValid === false) {
                    console.log("invalid reason:", slpValidator.cachedValidations[txid].invalidReason);
                }
                assert.equal(shouldBeValid, isValid);
            });
        });
    });
});
