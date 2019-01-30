const assert = require('assert');

const BITBOXSDK = require('../node_modules/bitbox-sdk/lib/bitbox-sdk').default;
const BITBOX = new BITBOXSDK({ restURL: "rest.bitcoin.com/v1/" });

const JsonRpcProxyValidator = require('../lib/jsonrpcvalidator').JsonRpcProxyValidator;

describe('JsonRpcProxyValidator', function() {
    let proxy = new JsonRpcProxyValidator(BITBOX, 'https://validate.simpleledger.info');
    describe('isValidSlpTxid()', function() {
        it('returns true for a valid SEND token transaction', async function() {
            let tokenTxnId = '2504b5b6a6ec42b040a71abce1acd71592f7e2a3e33ffa9c415f91a6b76deb45';
            let isValid = await proxy.isValidSlpTxid(tokenTxnId);
            assert.equal(isValid, true);
        });
        it('returns false for an unknown txid', async function() {
            let unknownTxnId = '00000006a6ec42b040a71abce1acd71592f7e2a3e33ffa9c415f91a6b76d0000';
            let isValid = await proxy.isValidSlpTxid(unknownTxnId);
            assert.equal(isValid, false);
        });
        it('returns true for MINT transaction', async function() {
            let mintTxnId = '02db2eabb3f1663daeab0648b22c3f8e13f10709cbb038089c4521f519fc0b89';
            let isValid = await proxy.isValidSlpTxid(mintTxnId);
            assert.equal(isValid, true);
        });
    });
    describe('validateSlpTransactions()', function() {
        it('works for valid SEND token transactions', async function() {
            this.timeout(5000);
            let tokenTxnIds = ['2504b5b6a6ec42b040a71abce1acd71592f7e2a3e33ffa9c415f91a6b76deb45', '2504b5b6a6ec42b040a71abce1acd71592f7e2a3e33ffa9c415f91a6b76deb45', '0004b5b6a6ec42b040a71abce1acd71592f7e2a3e33ffa9c415f91a6b76deb45'];
            let isValid = await proxy.validateSlpTransactions(tokenTxnIds);
            assert.deepEqual(isValid, ['2504b5b6a6ec42b040a71abce1acd71592f7e2a3e33ffa9c415f91a6b76deb45', '2504b5b6a6ec42b040a71abce1acd71592f7e2a3e33ffa9c415f91a6b76deb45']);
        });
        it('works for invalid SEND token transactions', async function() {
            this.timeout(5000);
            let tokenTxnIds = ['0004b5b6a6ec42b040a71abce1acd71592f7e2a3e33ffa9c415f91a6b76deb45', '0004b5b6a6ec42b040a71abce1acd71592f7e2a3e33ffa9c415f91a6b76deb45'];
            let isValid = await proxy.validateSlpTransactions(tokenTxnIds);
            assert.deepEqual(isValid, []);
        });
    });
});