const ProxyValidator = require('../lib/proxyvalidation');
const assert = require('assert');

describe('ProxyValidator', function(){
    describe('validateSlpTransaction()', function(){
        let proxy = new ProxyValidator();

        it('returns true for a valid SEND token transaction', async function(){
            let tokenTxnId = '2504b5b6a6ec42b040a71abce1acd71592f7e2a3e33ffa9c415f91a6b76deb45';
            let isValid = await proxy.validateSlpTransaction(tokenTxnId);
            assert.equal(isValid, true);
        });
        it('returns false for an unknown txid', async function(){
            let unknownTxnId = '00000006a6ec42b040a71abce1acd71592f7e2a3e33ffa9c415f91a6b76d0000';
            let isValid = await proxy.validateSlpTransaction(unknownTxnId);
            assert.equal(isValid, false);
        });
        it('returns true for MINT transaction', async function(){
            let mintTxnId = '02db2eabb3f1663daeab0648b22c3f8e13f10709cbb038089c4521f519fc0b89';
            let isValid = await proxy.validateSlpTransaction(mintTxnId);
            assert.equal(isValid, true);
        });
    });
});