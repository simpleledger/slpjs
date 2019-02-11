import { BitdbNetwork } from '../lib/bitdbnetwork';

import * as assert from 'assert';
import { BigNumber } from 'bignumber.js';

describe('BitdbNetwork', function() {
    describe('getTokenInformation()', function() {
        //console.log(JSON.stringify(BitdbNetwork));
        let net = new BitdbNetwork();
        it('returns token information for a given valid tokenId', async () => {
            let tokenId = '667b28d5885717e6d164c832504ae6b0c4db3c92072119ddfc5ff0db2c433456';
            let tokenInfo = await net.getTokenInformation(tokenId);
            let expectedTokenInfo = { 
                timestamp: '2019-01-19 14:33',
                tokenIdHex: '667b28d5885717e6d164c832504ae6b0c4db3c92072119ddfc5ff0db2c433456',
                transactionType: 0,
                versionType: 1, 
                symbol: 'BCH',
                name: 'Bitcoin Cash',
                documentUri: '',
                documentSha256: Buffer.from(''),
                decimals: 8,
                containsBaton: true,
                batonVout: 2, 
                genesisOrMintQuantity: new BigNumber("21000000")
            }
            assert.deepEqual(tokenInfo, expectedTokenInfo);
        });
        it('throws when tokeId is not found', async () => {
            let tokenId = '000028d5885717e6d164c832504ae6b0c4db3c92072119ddfc5ff0db2c433456';
            let threw = false;
            try {
                await net.getTokenInformation(tokenId);
            } catch(error) {
                threw = true;
                assert.equal(error.message, 'Token not found');
            } finally { assert.equal(threw, true); }
        });
    });
});