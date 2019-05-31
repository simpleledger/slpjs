import { BigNumber } from 'bignumber.js'
import { SlpTokenType1 as SlpTokenType1 } from '../lib/slptokentype1'

import * as assert from 'assert'

describe('SlpTokenType1', function() {
    describe('buildGenesisOpReturn()', function() {
        it('Succeeds with Minimal OP_RETURN', () => {
            let ticker = null
            let name = null
            let documentUri = null
            let documentHashHex = null
            let decimals = 0
            let batonVout = null
            let initialQuantity = new BigNumber(100)
            let op_return = SlpTokenType1.buildGenesisOpReturn(ticker, name, documentUri, documentHashHex, decimals, batonVout, initialQuantity)
            assert.equal(op_return.toString('hex'), '6a04534c500001010747454e455349534c004c004c004c0001004c00080000000000000064')
        })
        it('Succeeds with documentURI as Buffer', () => {
            let ticker = null
            let name = null
            let documentUri = Buffer.from('010101', 'hex')
            let documentHashHex = null
            let decimals = 0
            let batonVout = null
            let initialQuantity = new BigNumber(100)
            let op_return = SlpTokenType1.buildGenesisOpReturn(ticker, name, documentUri, documentHashHex, decimals, batonVout, initialQuantity)
            assert.equal(op_return.toString('hex'), '6a04534c500001010747454e455349534c004c00030101014c0001004c00080000000000000064')
        })
        it('Throws without BigNumber', () => {
            let ticker: null = null
            let name: null = null
            let documentUri: null = null
            let documentHashHex: null = null
            let decimals = 0
            let batonVout: null = null
            let initialQuantity: any = 100
            assert.throws(function () { SlpTokenType1.buildGenesisOpReturn(ticker, name, documentUri, documentHashHex, decimals, batonVout, initialQuantity as BigNumber) }, Error("Amount must be an instance of BigNumber"))
        })
        it('Throws with initial quantity too large', () => {
            let ticker: null = null
            let name: null = null
            let documentUri: null = null
            let documentHashHex: null = null
            let decimals = 0
            let batonVout: null = null
            let initialQuantity = new BigNumber('18446744073709551616')
            assert.throws(function () { SlpTokenType1.buildGenesisOpReturn(ticker, name, documentUri, documentHashHex, decimals, batonVout, initialQuantity) }, Error("Maximum genesis value exceeded. Reduce input quantity below 18446744073709551615."))
        })
        it('Throws with negative initial quantity', () => {
            let ticker: null = null
            let name: null = null
            let documentUri: null = null
            let documentHashHex: null = null
            let decimals = 0
            let batonVout: null = null
            let initialQuantity = new BigNumber('-1')
            assert.throws(function () { SlpTokenType1.buildGenesisOpReturn(ticker, name, documentUri, documentHashHex, decimals, batonVout, initialQuantity) }, Error("Genesis quantity must be greater than 0."))
        })
        it('Throws with a decimal initial quantity', () => {
            let ticker: null = null
            let name: null = null
            let documentUri: null = null
            let documentHashHex: null = null
            let decimals = 0
            let batonVout: null = null
            let initialQuantity = new BigNumber('1.1')
            assert.throws(function () { SlpTokenType1.buildGenesisOpReturn(ticker, name, documentUri, documentHashHex, decimals, batonVout, initialQuantity) }, Error("Genesis quantity must be a whole number."))
        })
        it('Throws when allocated OP_RETURN space is exceeded', () => {
            let ticker = "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
            let name = "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
            let documentUri = "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
            let documentHashHex: null = null
            let decimals = 0
            let batonVout: null = null
            let initialQuantity = new BigNumber('18446744073709551615')
            assert.throws(function () { SlpTokenType1.buildGenesisOpReturn(ticker, name, documentUri, documentHashHex, decimals, batonVout, initialQuantity) }, Error("Script too long, must be less than 223 bytes."))
        })
        it('Succeeds with batonVout is 2 and max inital quantity is used', () => {
            let ticker = null
            let name = null
            let documentUri = null
            let documentHashHex = null
            let decimals = 0
            let batonVout = 2
            let initialQuantity = new BigNumber('18446744073709551615')
            let op_return = SlpTokenType1.buildGenesisOpReturn(ticker, name, documentUri, documentHashHex, decimals, batonVout, initialQuantity)
            assert.equal(op_return.toString('hex'), '6a04534c500001010747454e455349534c004c004c004c000100010208ffffffffffffffff')
        })
        it('Throws when batonVout is less than 2', () => {
            let ticker: null = null
            let name: null = null
            let documentUri: null = null
            let documentHashHex: null = null
            let decimals = 0
            let batonVout = 1
            let initialQuantity = new BigNumber('18446744073709551615')
            assert.throws(function () { SlpTokenType1.buildGenesisOpReturn(ticker, name, documentUri, documentHashHex, decimals, batonVout, initialQuantity) }, Error("Baton vout must a number and greater than 1 and less than 256."))
        })
        it('Throws when batonVout is less than 2', () => {
            let ticker: null = null
            let name: null = null
            let documentUri: null = null
            let documentHashHex: null = null
            let decimals = 0
            let batonVout = 0
            let initialQuantity = new BigNumber('18446744073709551615')
            assert.throws(function () { SlpTokenType1.buildGenesisOpReturn(ticker, name, documentUri, documentHashHex, decimals, batonVout, initialQuantity) }, Error("Baton vout must a number and greater than 1 and less than 256."))
        })
        it('Throws when batonVout is less than 2', () => {
            let ticker: null = null
            let name: null = null
            let documentUri: null = null
            let documentHashHex: null = null
            let decimals = 0
            let batonVout = -1
            let initialQuantity = new BigNumber('18446744073709551615')
            assert.throws(function () { SlpTokenType1.buildGenesisOpReturn(ticker, name, documentUri, documentHashHex, decimals, batonVout, initialQuantity) }, Error("Baton vout must a number and greater than 1 and less than 256."))
        })
        it('Throws when batonVout is greater than 255', () => {
            let ticker: null = null
            let name: null = null
            let documentUri: null = null
            let documentHashHex: null = null
            let decimals = 0
            let batonVout = 256
            let initialQuantity = new BigNumber('18446744073709551615')
            assert.throws(function () { SlpTokenType1.buildGenesisOpReturn(ticker, name, documentUri, documentHashHex, decimals, batonVout, initialQuantity) }, Error("Baton vout must a number and greater than 1 and less than 256."))
        })
        it('Throws when decimals is too high', () => {
            let ticker: null = null
            let name: null = null
            let documentUri: null = null
            let documentHashHex: null = null
            let decimals = 10
            let batonVout: null = null
            let initialQuantity = new BigNumber('18446744073709551615')
            assert.throws(function () { SlpTokenType1.buildGenesisOpReturn(ticker, name, documentUri, documentHashHex, decimals, batonVout, initialQuantity) }, Error("Decimals property must be in range 0 to 9"))
        })
        it('Throws when decimals is negative', () => {
            let ticker: null = null
            let name: null = null
            let documentUri: null = null
            let documentHashHex: null = null
            let decimals = -1
            let batonVout: null = null
            let initialQuantity = new BigNumber('18446744073709551615')
            assert.throws(function () { SlpTokenType1.buildGenesisOpReturn(ticker, name, documentUri, documentHashHex, decimals, batonVout, initialQuantity) }, Error("Decimals property must be in range 0 to 9"))
        })
        it('Throws when decimals is null', () => {
            let ticker: null = null
            let name: null = null
            let documentUri: null = null
            let documentHashHex: null = null
            let decimals: any = null
            let batonVout: null = null
            let initialQuantity = new BigNumber('18446744073709551615')
            assert.throws(function () { SlpTokenType1.buildGenesisOpReturn(ticker, name, documentUri, documentHashHex, decimals as number, batonVout, initialQuantity) }, Error("Decimals property must be in range 0 to 9"))
        })
        it('Throws when initialQuantity is null', () => {
            let ticker: null = null
            let name: null = null
            let documentUri: null = null
            let documentHashHex: null = null
            let decimals = 0
            let batonVout: null = null
            let initialQuantity: any = null
            assert.throws(function () { SlpTokenType1.buildGenesisOpReturn(ticker, name, documentUri, documentHashHex, decimals, batonVout, initialQuantity as BigNumber) }, Error("Amount must be an instance of BigNumber"))
        })
        it('Throws when documentUri is provided as Number', () => {
            let ticker: null = null
            let name: null = null
            let documentUri: null = null
            let documentHashHex: any = 100
            let decimals = 0
            let batonVout: null = null
            let initialQuantity = new BigNumber('18446744073709551615')
            assert.throws(function () { SlpTokenType1.buildGenesisOpReturn(ticker, name, documentUri, documentHashHex, decimals, batonVout, initialQuantity) }, Error("Document hash must be provided as a 64 character hex string"))
        })
        it('Throws when documentUri is provided as non-hex string', () => {
            let ticker: null = null
            let name: null = null
            let documentUri: null = null
            let documentHashHex = "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz"
            let decimals = 0
            let batonVout: null = null
            let initialQuantity = new BigNumber('18446744073709551615')
            assert.throws(function () { SlpTokenType1.buildGenesisOpReturn(ticker, name, documentUri, documentHashHex, decimals, batonVout, initialQuantity) }, Error("Document hash must be provided as a 64 character hex string"))
        })
        it('Throws when ticker is not a string', () => {
            let ticker: any = ['a']
            let name: null = null
            let documentUri: null = null
            let documentHashHex: null = null
            let decimals = 0
            let batonVout: null = null
            let initialQuantity = new BigNumber('18446744073709551615')
            assert.throws(function () { SlpTokenType1.buildGenesisOpReturn(ticker as string, name, documentUri, documentHashHex, decimals, batonVout, initialQuantity) }, Error("ticker must be a string"))
        })
        it('Throws when name is not a string', () => {
            let ticker: null = null
            let name: any = ['a']
            let documentUri: null = null
            let documentHashHex: null = null
            let decimals = 0
            let batonVout: null = null
            let initialQuantity = new BigNumber('18446744073709551615')
            assert.throws(function () { SlpTokenType1.buildGenesisOpReturn(ticker, name as string, documentUri, documentHashHex, decimals, batonVout, initialQuantity) }, Error("name must be a string"))
        })
        it('Throws when documentUri is not a string', () => {
            let ticker: null = null
            let name: null = null
            let documentUri: any = 1
            let documentHashHex: null = null
            let decimals = 0
            let batonVout: null = null
            let initialQuantity = new BigNumber('18446744073709551615')
            assert.throws(function () { SlpTokenType1.buildGenesisOpReturn(ticker, name, documentUri as string, documentHashHex, decimals, batonVout, initialQuantity) }, Error("documentUri must be a string or a buffer"))
        })
        it('Throws when documentHashHex is not a string', () => {
            let ticker: null = null
            let name: null = null
            let documentUri: null = null
            let documentHashHex: any = 1
            let decimals = 0
            let batonVout: null = null
            let initialQuantity = new BigNumber('18446744073709551615')
            assert.throws(function () { SlpTokenType1.buildGenesisOpReturn(ticker, name, documentUri, documentHashHex as string, decimals, batonVout, initialQuantity) }, Error("Document hash must be provided as a 64 character hex string"))
        })
    })
    describe('buildSendOpReturn()', function() {
        it('Succeeds with 1 output', () => {
            let expectedResult = "6a04534c500001010453454e44208888888888888888888888888888888888888888888888888888888888888888080000000000000042";
            let tokenIdHex = "8888888888888888888888888888888888888888888888888888888888888888"
            let outputQtyArray = [ new BigNumber('66') ]
            let result = SlpTokenType1.buildSendOpReturn(tokenIdHex, outputQtyArray).toString('hex')
            assert.equal(result, expectedResult)
        })
        it('Succeeds with 2 outputs', () => {
            let expectedResult = "6a04534c500001010453454e44208888888888888888888888888888888888888888888888888888888888888888080000000000000042080000000000000063";
            let tokenIdHex = "8888888888888888888888888888888888888888888888888888888888888888"
            let outputQtyArray = [ new BigNumber('66'), new BigNumber('99') ]
            let result = SlpTokenType1.buildSendOpReturn(tokenIdHex, outputQtyArray).toString('hex')
            assert.equal(result, expectedResult)
        })
        it('Succeeds with 19 outputs', () => {
            let expectedResult = "6a04534c500001010453454e44208888888888888888888888888888888888888888888888888888888888888888080000000000000042080000000000000063080000000000000063080000000000000063080000000000000063080000000000000042080000000000000063080000000000000063080000000000000063080000000000000063080000000000000042080000000000000063080000000000000063080000000000000063080000000000000063080000000000000042080000000000000063080000000000000063080000000000000063";
            let tokenIdHex = "8888888888888888888888888888888888888888888888888888888888888888"
            let outputQtyArray = [ new BigNumber('66'), new BigNumber('99'), new BigNumber('99'), new BigNumber('99'), new BigNumber('99'),
                                    new BigNumber('66'), new BigNumber('99'), new BigNumber('99'), new BigNumber('99'), new BigNumber('99'),
                                    new BigNumber('66'), new BigNumber('99'), new BigNumber('99'), new BigNumber('99'), new BigNumber('99'),
                                    new BigNumber('66'), new BigNumber('99'), new BigNumber('99'), new BigNumber('99') ]
            let result = SlpTokenType1.buildSendOpReturn(tokenIdHex, outputQtyArray).toString('hex')
            assert.equal(result, expectedResult)
        })
        it('Throws with 20 outputs', () => {
            let tokenIdHex = "8888888888888888888888888888888888888888888888888888888888888888"
            let outputQtyArray = [ new BigNumber('66'), new BigNumber('99'), new BigNumber('99'), new BigNumber('99'), new BigNumber('99'),
                                    new BigNumber('66'), new BigNumber('99'), new BigNumber('99'), new BigNumber('99'), new BigNumber('99'),
                                    new BigNumber('66'), new BigNumber('99'), new BigNumber('99'), new BigNumber('99'), new BigNumber('99'),
                                    new BigNumber('66'), new BigNumber('99'), new BigNumber('99'), new BigNumber('99'), new BigNumber('99') ]
            assert.throws(function() {SlpTokenType1.buildSendOpReturn(tokenIdHex, outputQtyArray)} , Error("Cannot have more than 19 SLP token outputs."))
        })
        it('Throws with 0 outputs', () => {
            let tokenIdHex = "8888888888888888888888888888888888888888888888888888888888888888"
            let outputQtyArray: never[] = []
            assert.throws(function() {SlpTokenType1.buildSendOpReturn(tokenIdHex, outputQtyArray)}, Error("Cannot have less than 1 SLP token output."))
        })
        it('Throws with null outputs', () => {
            let tokenIdHex = "8888888888888888888888888888888888888888888888888888888888888888"
            let outputQtyArray: any = null
            assert.throws(function() {SlpTokenType1.buildSendOpReturn(tokenIdHex, outputQtyArray as BigNumber[])}, TypeError)
        })
        it('Throws with BigNumber outputs', () => {
            let tokenIdHex = "8888888888888888888888888888888888888888888888888888888888888888"
            let outputQtyArray: any = new BigNumber('100')
            assert.throws(function() {SlpTokenType1.buildSendOpReturn(tokenIdHex, outputQtyArray as BigNumber[])}, TypeError)
        })
        it('Throws with tokenIdHex too short', () => {
            let tokenIdHex = "88888888888888888888888888888888888888888888888888888888888888"
            let outputQtyArray = [ new BigNumber('66') ]
            assert.throws(function() {SlpTokenType1.buildSendOpReturn(tokenIdHex, outputQtyArray)}, Error("TokenIdHex must be provided as a 64 character hex string."))
        })
        it('Throws with tokenIdHex too long', () => {
            let tokenIdHex = "888888888888888888888888888888888888888888888888888888888888888888"
            let outputQtyArray = [ new BigNumber('66') ]
            assert.throws(function() {SlpTokenType1.buildSendOpReturn(tokenIdHex, outputQtyArray)}, Error("TokenIdHex must be provided as a 64 character hex string."))
        })
        it('Throws with tokenIdHex non-hex string', () => {
            let tokenIdHex = "zz88888888888888888888888888888888888888888888888888888888888888"
            let outputQtyArray = [ new BigNumber('66') ]
            assert.throws(function() {SlpTokenType1.buildSendOpReturn(tokenIdHex, outputQtyArray)}, Error("TokenIdHex must be provided as a 64 character hex string."))
        })
        it('Throws with tokenIdHex not a string', () => {
            let tokenIdHex: any = 1
            let outputQtyArray = [ new BigNumber('66') ]
            assert.throws(function() {SlpTokenType1.buildSendOpReturn(tokenIdHex as string, outputQtyArray)}, Error("TokenIdHex must be provided as a 64 character hex string."))
        })
        it('Throws with tokenIdHex not as null', () => {
            let tokenIdHex: any = null
            let outputQtyArray = [ new BigNumber('66') ]
            assert.throws(function() {SlpTokenType1.buildSendOpReturn(tokenIdHex as string, outputQtyArray)}, Error("TokenIdHex must be provided as a 64 character hex string."))
        })
    })
    describe('buildMintOpReturn()', function() {
        it('Succeeds when batonVout = null', () => {
            let expectedResult = "6a04534c50000101044d494e5420ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff4c00080000000000000064"
            let tokenIdHex = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
            let batonVout = null
            let mintQuantity = new BigNumber('100')
            let result = SlpTokenType1.buildMintOpReturn(tokenIdHex, batonVout, mintQuantity).toString('hex')
            assert.equal(result, expectedResult)
        })
        it('Succeeds when batonVout is 2', () => {
            let expectedResult = "6a04534c50000101044d494e5420ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0102080000000000000064"
            let tokenIdHex = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
            let batonVout = 2
            let mintQuantity = new BigNumber('100')
            let result = SlpTokenType1.buildMintOpReturn(tokenIdHex, batonVout, mintQuantity).toString('hex')
            assert.equal(result, expectedResult)
        })
        it('Throws when batonVout is 1', () => {
            let tokenIdHex = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
            let batonVout = 1
            let mintQuantity = new BigNumber('66')
            //SlpTokenType1.buildMintOpReturn(tokenIdHex, batonVout, mintQuantity)
            assert.throws(function(){SlpTokenType1.buildMintOpReturn(tokenIdHex, batonVout, mintQuantity)}, Error("Baton vout must a number and greater than 1 and less than 256."))
        })
        it('Throws when batonVout is 256', () => {
            let tokenIdHex = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
            let batonVout = 256
            let mintQuantity = new BigNumber('66')
            assert.throws(function(){SlpTokenType1.buildMintOpReturn(tokenIdHex, batonVout, mintQuantity)}, Error("Baton vout must a number and greater than 1 and less than 256."))
        })
        it('Throws when mintQuantity is a number', () => {
            let tokenIdHex = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
            let batonVout: null = null
            let mintQuantity: any = 1
            assert.throws(function(){SlpTokenType1.buildMintOpReturn(tokenIdHex, batonVout, mintQuantity as BigNumber)}, Error("Amount must be an instance of BigNumber"))
        })
        it('Throws when mintQuantity is null', () => {
            let tokenIdHex = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
            let batonVout: null = null
            let mintQuantity: any = null
            assert.throws(function(){SlpTokenType1.buildMintOpReturn(tokenIdHex, batonVout, mintQuantity as BigNumber)}, Error("Amount must be an instance of BigNumber"))
        })
        it('Throws when mintQuantity is too large', () => {
            let tokenIdHex = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
            let batonVout: null = null
            let mintQuantity = new BigNumber('18446744073709551616')
            assert.throws(function(){SlpTokenType1.buildMintOpReturn(tokenIdHex, batonVout, mintQuantity)}, Error("Maximum mint value exceeded. Reduce input quantity below 18446744073709551615."))
        })
        it('Throws when mintQuantity is negative', () => {
            let tokenIdHex = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
            let batonVout: null = null
            let mintQuantity = new BigNumber('-1')
            assert.throws(function(){SlpTokenType1.buildMintOpReturn(tokenIdHex, batonVout, mintQuantity)}, Error("Mint quantity must be greater than 0."))
        })
        it('Throws when mintQuantity is decimal', () => {
            let tokenIdHex = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
            let batonVout: null = null
            let mintQuantity = new BigNumber('1.1')
            assert.throws(function(){SlpTokenType1.buildMintOpReturn(tokenIdHex, batonVout, mintQuantity)}, Error("Mint quantity must be a whole number."))
        })
        it('Throws when mintQuantity is array', () => {
            let tokenIdHex = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
            let batonVout: null = null
            let mintQuantity: any = [ new BigNumber('1') ]
            assert.throws(function(){SlpTokenType1.buildMintOpReturn(tokenIdHex, batonVout, mintQuantity as BigNumber)}, Error("Amount must be an instance of BigNumber"))
        })
        it('Throws with tokenIdHex too short', () => {
            let tokenIdHex = "888888888888888888888888888888888888888888888888888888888888"
            let batonVout: null = null
            let mintQuantity = new BigNumber('66')
            assert.throws(function() {SlpTokenType1.buildMintOpReturn(tokenIdHex, batonVout, mintQuantity)}, Error("TokenIdHex must be provided as a 64 character hex string."))
        })
        it('Throws with tokenIdHex too long', () => {
            let tokenIdHex = "888888888888888888888888888888888888888888888888888888888888888888"
            let batonVout: null = null
            let mintQuantity = new BigNumber('66')
            assert.throws(function() {SlpTokenType1.buildMintOpReturn(tokenIdHex, batonVout, mintQuantity)}, Error("TokenIdHex must be provided as a 64 character hex string."))
        })
        it('Throws with tokenIdHex non-hex string', () => {
            let tokenIdHex = "zz88888888888888888888888888888888888888888888888888888888888888"
            let batonVout: null = null
            let mintQuantity = new BigNumber('66')
            assert.throws(function() {SlpTokenType1.buildMintOpReturn(tokenIdHex, batonVout, mintQuantity)}, Error("TokenIdHex must be provided as a 64 character hex string."))
        })
        it('Throws with tokenIdHex not a string', () => {
            let tokenIdHex: any = 1
            let batonVout: null = null
            let mintQuantity = new BigNumber('66')
            assert.throws(function() {SlpTokenType1.buildMintOpReturn(tokenIdHex as string, batonVout, mintQuantity)}, Error("TokenIdHex must be provided as a 64 character hex string."))
        })
        it('Throws with tokenIdHex not as null', () => {
            let tokenIdHex: any = null
            let batonVout: null = null
            let mintQuantity = new BigNumber('66')
            assert.throws(function() {SlpTokenType1.buildMintOpReturn(tokenIdHex as string, batonVout, mintQuantity)}, Error("TokenIdHex must be provided as a 64 character hex string."))
        })
    })
})