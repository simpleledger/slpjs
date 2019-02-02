import BITBOXSDK from 'bitbox-sdk/lib/bitbox-sdk';
const BITBOX = new BITBOXSDK();
import * as assert from 'assert';
import "mocha";
import { LocalValidator, GetRawTransactionsAsync } from '../lib/localvalidator';
import { SlpValidityUnitTest, SlpTestTxn } from './global';
const txUnitTestData: SlpValidityUnitTest[] = require('slp-unit-test-data/tx_input_tests.json');

describe('Slp', function() {
    describe('isValidSlpTxid() -- SLP Transaction Validation Unit Tests', function() {
        txUnitTestData.forEach(test => {
            it(test.description, async () => {
                this.timeout(20000);
                let getRawUnitTestTransactions: GetRawTransactionsAsync = async (txids: string[]) => {
                    let allTxns: SlpTestTxn[] = test.when.concat(test.should);
                    console.log('looking for:',txids[0])
                    let txn = allTxns.find(i => { 
                        let hash = BITBOX.Crypto.sha256(BITBOX.Crypto.sha256(Buffer.from(i.tx, 'hex'))).toString('hex');
                        console.log(hash)
                        return hash === txids[0] 
                    });
                    if(txn)
                        return [txn.tx];
                    return undefined
                }
    
                const slpValidator = new LocalValidator(BITBOX, getRawUnitTestTransactions);

                let txid = BITBOX.Crypto.sha256(BITBOX.Crypto.sha256(Buffer.from(test.should[0].tx, 'hex'))).toString('hex');
                let shouldBeValid = test.should[0].valid;
                let isValid = await slpValidator.isValidSlpTxid(txid);

                assert.equal(isValid, shouldBeValid);
            });
        })
    });
});