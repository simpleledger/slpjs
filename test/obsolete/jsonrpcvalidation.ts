import { JsonRpcProxyValidator } from '../../lib/jsonrpcvalidator';

import * as assert from 'assert';
import BITBOXSDK from 'bitbox-sdk';

const bitbox = new BITBOXSDK({ restURL: "https://rest.bitcoin.com/v2/" });
let mainnetProxy = new JsonRpcProxyValidator(bitbox, 'https://validate.simpleledger.info');
let testnetProxy = new JsonRpcProxyValidator(bitbox, 'https://testnet-validate.simpleledger.info');

describe('JsonRpcProxyValidator', function() {
    describe('mainnet isValidSlpTxid()', function() {
        it('returns true for a valid SEND token transaction', async function() {
            let tokenTxnId = '2504b5b6a6ec42b040a71abce1acd71592f7e2a3e33ffa9c415f91a6b76deb45';
            let isValid = await mainnetProxy.isValidSlpTxid(tokenTxnId);
            assert.equal(isValid, true);
        });
        it('returns false for an unknown txid', async function() {
            let unknownTxnId = '00000006a6ec42b040a71abce1acd71592f7e2a3e33ffa9c415f91a6b76d0000';
            let isValid = await mainnetProxy.isValidSlpTxid(unknownTxnId);
            assert.equal(isValid, false);
        });
        it('returns true for MINT transaction', async function() {
            let mintTxnId = '02db2eabb3f1663daeab0648b22c3f8e13f10709cbb038089c4521f519fc0b89';
            let isValid = await mainnetProxy.isValidSlpTxid(mintTxnId);
            assert.equal(isValid, true);
        });
    });
    describe('mainnet validateSlpTransactions()', function() {
        it('works for valid SEND token transactions', async function() {
            this.timeout(5000);
            let tokenTxnIds = ['2504b5b6a6ec42b040a71abce1acd71592f7e2a3e33ffa9c415f91a6b76deb45', '2504b5b6a6ec42b040a71abce1acd71592f7e2a3e33ffa9c415f91a6b76deb45', '0004b5b6a6ec42b040a71abce1acd71592f7e2a3e33ffa9c415f91a6b76deb45'];
            let isValid = await mainnetProxy.validateSlpTransactions(tokenTxnIds);
            assert.deepEqual(isValid, ['2504b5b6a6ec42b040a71abce1acd71592f7e2a3e33ffa9c415f91a6b76deb45', '2504b5b6a6ec42b040a71abce1acd71592f7e2a3e33ffa9c415f91a6b76deb45']);
        });
        it('works for invalid SEND token transactions', async function() {
            this.timeout(5000);
            let tokenTxnIds = ['0004b5b6a6ec42b040a71abce1acd71592f7e2a3e33ffa9c415f91a6b76deb45', '0004b5b6a6ec42b040a71abce1acd71592f7e2a3e33ffa9c415f91a6b76deb45'];
            let isValid = await mainnetProxy.validateSlpTransactions(tokenTxnIds);
            assert.deepEqual(isValid, []);
        });
    });
    describe('testnet isValidSlpTxid()', function() {
        it('returns true for a valid SEND token transaction', async function() {
            let tokenTxnId = 'f8062aab5b36b5f34ca037e83f9710032d5a730a672a69c1f00c78a2628d59c6';
            let isValid = await testnetProxy.isValidSlpTxid(tokenTxnId);
            assert.equal(isValid, true);
        });
        it('returns false for an unknown txid', async function() {
            let unknownTxnId = '00000006a6ec42b040a71abce1acd71592f7e2a3e33ffa9c415f91a6b76d0000';
            let isValid = await testnetProxy.isValidSlpTxid(unknownTxnId);
            assert.equal(isValid, false);
        });
        it('returns true for MINT transaction', async function() {
            let mintTxnId = '93e4332685740b49c216ce9179aed6f1c92a220ea0dba15421dd7cb34ac665db';
            let isValid = await testnetProxy.isValidSlpTxid(mintTxnId);
            assert.equal(isValid, true);
        });
    });
    describe('testnet validateSlpTransactions()', function() {
        it('works for valid SEND token transactions', async function() {
            this.timeout(5000);
            let tokenTxnIds = ['f8062aab5b36b5f34ca037e83f9710032d5a730a672a69c1f00c78a2628d59c6', 'f8062aab5b36b5f34ca037e83f9710032d5a730a672a69c1f00c78a2628d59c6', '0004b5b6a6ec42b040a71abce1acd71592f7e2a3e33ffa9c415f91a6b76deb45'];
            let isValid = await testnetProxy.validateSlpTransactions(tokenTxnIds);
            assert.deepEqual(isValid, ['f8062aab5b36b5f34ca037e83f9710032d5a730a672a69c1f00c78a2628d59c6', 'f8062aab5b36b5f34ca037e83f9710032d5a730a672a69c1f00c78a2628d59c6']);
        });
        it('works for invalid SEND token transactions', async function() {
            this.timeout(5000);
            let tokenTxnIds = ['0004b5b6a6ec42b040a71abce1acd71592f7e2a3e33ffa9c415f91a6b76deb45', '0004b5b6a6ec42b040a71abce1acd71592f7e2a3e33ffa9c415f91a6b76deb45'];
            let isValid = await testnetProxy.validateSlpTransactions(tokenTxnIds);
            assert.deepEqual(isValid, []);
        });
    });
});
