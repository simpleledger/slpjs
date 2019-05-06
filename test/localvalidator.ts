import { LocalValidator, GetRawTransactionsAsync } from '../lib/localvalidator';
import { SlpValidityUnitTest, SlpTestTxn } from './global';

import * as assert from 'assert';
import "mocha";
import { BITBOX } from 'bitbox-sdk';
const bitbox = new BITBOX();
const txUnitTestData: SlpValidityUnitTest[] = require('slp-unit-test-data/tx_input_tests.json');

describe('Slp', function() {
    describe('isValidSlpTxid() -- SLP Transaction Validation Unit Tests', function() {
        txUnitTestData.forEach(test => {
            it(test.description, async () => {

                // Create method for serving up the unit test transactions 
                let getRawUnitTestTransactions: GetRawTransactionsAsync = async (txids: string[]) => {
                    let allTxns: SlpTestTxn[] = test.when.concat(test.should);
                    let txn = allTxns.find(i => {
                        let hash = (<Buffer>bitbox.Crypto.sha256(bitbox.Crypto.sha256(Buffer.from(i.tx, 'hex'))).reverse()).toString('hex');
                        return hash === txids[0] 
                    });
                    if(txn)
                        return [txn.tx];
                    throw Error("Transaction data for the provided txid not found (txid: " + txids[0] + ")")
                }
    
                // Create instance of Local Validator
                var slpValidator = new LocalValidator(bitbox, getRawUnitTestTransactions);

                // Pre-Load Validator the unit-test inputs
                test.when.forEach(w => {
                    slpValidator.addValidationFromStore(w.tx, w.valid)
                });

                let txid = (<Buffer>bitbox.Crypto.sha256(bitbox.Crypto.sha256(Buffer.from(test.should[0].tx, 'hex'))).reverse()).toString('hex');
                let shouldBeValid = test.should[0].valid;
                let isValid = await slpValidator.isValidSlpTxid(txid);
                if(isValid === false)
                    console.log('invalid reason:', slpValidator.cachedValidations[txid].invalidReason);
                assert.equal(isValid, shouldBeValid);
            });
        })
    });
});
