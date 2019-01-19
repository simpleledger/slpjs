const BitdbProxy = require('../lib/bitdbproxy');
const assert = require('assert');

describe('BitdbProxy', function(){
    describe('getTokenInformation()', function(){
        let proxy = new BitdbProxy();
        it('returns token information for a given valid tokenId', async () => {
            let tokenId = '667b28d5885717e6d164c832504ae6b0c4db3c92072119ddfc5ff0db2c433456';
            let tokenInfo = await proxy.getTokenInformation(tokenId);
            let expectedTokenInfo = { timestamp: '2019-01-19 14:33',
                symbol: 'BCH',
                name: 'Bitcoin Cash',
                token_document_uri: '',
                token_document_sha256: null,
                decimals: 8,
                baton: true,
                quantity: 21000000 
            }
            assert.equal(JSON.stringify(tokenInfo), JSON.stringify(expectedTokenInfo));
        });
        it('throws when tokeId is not found', async () => {
            let tokenId = '000028d5885717e6d164c832504ae6b0c4db3c92072119ddfc5ff0db2c433456';
            let threw = false;
            try {
                await proxy.getTokenInformation(tokenId);
            } catch(error) {
                threw = true;
                assert.equal(error.message, 'Token not found');
            } finally { assert.equal(threw, true); }
        });
    });
});