import { BitboxNetwork } from "../lib/bitboxnetwork";

import * as assert from 'assert';
import { BigNumber } from 'bignumber.js';
import { BITBOX } from "bitbox-sdk";

describe('BitboxNetwork (mainnet)', function() {
    const bitbox = new BITBOX();
    describe('getTokenInformation()', function() {
        //console.log(JSON.stringify(BitdbNetwork));
        let net = new BitboxNetwork(bitbox);
        it('returns token information for a given valid tokenId', async () => {
            let tokenId = '667b28d5885717e6d164c832504ae6b0c4db3c92072119ddfc5ff0db2c433456';
            let tokenInfo = await net.getTokenInformation(tokenId, true);
            let expectedTokenInfo = { 
                tokenIdHex: '667b28d5885717e6d164c832504ae6b0c4db3c92072119ddfc5ff0db2c433456',
                transactionType: "GENESIS",
                versionType: 1, 
                symbol: 'BCH',
                name: 'Bitcoin Cash',
                documentUri: '',
                documentSha256: null,
                decimals: 8,
                containsBaton: true,
                batonVout: 2, 
                genesisOrMintQuantity: new BigNumber("21000000")
            }
            assert.deepEqual(tokenInfo, expectedTokenInfo);
        });
        it('throws when tokenId is not found', async () => {
            let tokenId = '000028d5885717e6d164c832504ae6b0c4db3c92072119ddfc5ff0db2c433456';
            let threw = false;
            try {
                await net.getTokenInformation(tokenId);
            } catch(error) {
                threw = true;
                assert.equal(error.message, 'No such mempool or blockchain transaction. Use gettransaction for wallet transactions.');
            } finally { assert.equal(threw, true); }
        });
    });
});