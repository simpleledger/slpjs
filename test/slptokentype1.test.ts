import { BigNumber } from "bignumber.js";
import { SlpTokenType1 as SlpTokenType1 } from "../lib/slptokentype1";

import * as assert from "assert";

describe("SlpTokenType1", () => {
    describe("buildGenesisOpReturn()", () => {
        it("Succeeds with Minimal OP_RETURN", () => {
            const ticker = null;
            const name = null;
            const documentUri = null;
            const documentHashHex = null;
            const decimals = 0;
            const batonVout = null;
            const initialQuantity = new BigNumber(100);
            let op_return = SlpTokenType1.buildGenesisOpReturn(ticker, name, documentUri, documentHashHex, decimals, batonVout, initialQuantity);
            assert.strictEqual(op_return.toString("hex"), "6a04534c500001010747454e455349534c004c004c004c0001004c00080000000000000064");
        });
        it("Succeeds with Minimal NFT1 Group OP_RETURN", () => {
            const ticker = null;
            const name = null;
            const documentUri = null;
            const documentHashHex = null;
            const decimals = 0;
            const batonVout = null;
            const initialQuantity = new BigNumber(100);
            let op_return = SlpTokenType1.buildGenesisOpReturn(ticker, name, documentUri, documentHashHex, decimals, batonVout, initialQuantity, 0x81);
            assert.strictEqual(op_return.toString("hex"), "6a04534c500001810747454e455349534c004c004c004c0001004c00080000000000000064");
        });
        it("Succeeds with Minimal NFT1 Child OP_RETURN", () => {
            const ticker = null;
            const name = null;
            const documentUri = null;
            const documentHashHex = null;
            const decimals = 0;
            const batonVout = null;
            const initialQuantity = new BigNumber(1);
            let op_return = SlpTokenType1.buildGenesisOpReturn(ticker, name, documentUri, documentHashHex, decimals, batonVout, initialQuantity, 0x41);
            assert.strictEqual(op_return.toString("hex"), "6a04534c500001410747454e455349534c004c004c004c0001004c00080000000000000001");
        });
        it("NFT child throws on mint", () => {
            assert.throws(() => { SlpTokenType1.buildMintOpReturn("6a04534c500001410747454e455349534c004c004c004c0001004c00080000000000000001", 1, new BigNumber(1), 0x41)}, "test");
        });
        it("NFT child throws on genesis qty != 1", () => {
            const ticker = null;
            const name = null;
            const documentUri = null;
            const documentHashHex = null;
            const decimals = 0;
            const batonVout = null;
            const initialQuantity = new BigNumber(2);
            assert.throws(() => { SlpTokenType1.buildGenesisOpReturn(ticker, name, documentUri, documentHashHex, decimals, batonVout, initialQuantity, 0x41)}, Error("nft1 child output quantity must be equal to 1"));
        });
        it("NFT child throws on send qty != 1", () => {
            assert.throws(() => { SlpTokenType1.buildSendOpReturn("6a04534c500001410747454e455349534c004c004c004c0001004c00080000000000000001", [new BigNumber(2)], 0x41) }, Error("nft1 child output quantity must be equal to 1"));
        });
        it("NFT child throws on send with qty array length != 1", () => {
            assert.throws(() => { SlpTokenType1.buildSendOpReturn("6a04534c500001410747454e455349534c004c004c004c0001004c00080000000000000001", [new BigNumber(1), new BigNumber(0)], 0x41) }, Error("nft1 child must have exactly 1 output quantity"));
        });
        it("Genesis, Send, and Mint throws on type 0x02", () => {
            const ticker = null;
            const name = null;
            const documentUri = null;
            const documentHashHex = null;
            const decimals = 0;
            const batonVout = null;
            const initialQuantity = new BigNumber(100);
            assert.throws(() => { SlpTokenType1.buildGenesisOpReturn(ticker, name, documentUri, documentHashHex, decimals, batonVout, initialQuantity, 0x02); }, Error("unsupported token type"));
            assert.throws(() => { SlpTokenType1.buildMintOpReturn("6a04534c500001410747454e455349534c004c004c004c0001004c00080000000000000001", 1, new BigNumber(1), 0x02); }, Error("unsupported token type"));
            assert.throws(() => { SlpTokenType1.buildSendOpReturn("6a04534c500001410747454e455349534c004c004c004c0001004c00080000000000000001", [new BigNumber(1)], 0x02); }, Error("unsupported token type"));
        });
        it("Succeeds with Minimal OP_RETURN", () => {
            const ticker = null;
            const name = null;
            const documentUri = null;
            const documentHashHex = null;
            const decimals = 0;
            const batonVout = null;
            const initialQuantity = new BigNumber(100);
            let op_return = SlpTokenType1.buildGenesisOpReturn(ticker, name, documentUri, documentHashHex, decimals, batonVout, initialQuantity);
            assert.strictEqual(op_return.toString("hex"), "6a04534c500001010747454e455349534c004c004c004c0001004c00080000000000000064");
        });
        it("Throws without BigNumber", () => {
            const ticker: null = null;
            const name: null = null;
            const documentUri: null = null;
            const documentHashHex: null = null;
            const decimals = 0;
            const batonVout: null = null;
            const initialQuantity: any = 100;
            assert.throws(function () { SlpTokenType1.buildGenesisOpReturn(ticker, name, documentUri, documentHashHex, decimals, batonVout, initialQuantity as BigNumber); }, TypeError("bn.isInteger is not a function"));
        });
        it("Throws with initial quantity too large", () => {
            const ticker: null = null;
            const name: null = null;
            const documentUri: null = null;
            const documentHashHex: null = null;
            const decimals = 0;
            const batonVout: null = null;
            const initialQuantity = new BigNumber("18446744073709551616");
            assert.throws(function () { SlpTokenType1.buildGenesisOpReturn(ticker, name, documentUri, documentHashHex, decimals, batonVout, initialQuantity); }, Error("bn outside of range"));
        });
        it("Throws with negative initial quantity", () => {
            const ticker: null = null;
            const name: null = null;
            const documentUri: null = null;
            const documentHashHex: null = null;
            const decimals = 0;
            const batonVout: null = null;
            const initialQuantity = new BigNumber("-1");
            assert.throws(function () { SlpTokenType1.buildGenesisOpReturn(ticker, name, documentUri, documentHashHex, decimals, batonVout, initialQuantity); }, Error("bn not positive integer"));
        });
        it("Throws with a decimal initial quantity", () => {
            const ticker: null = null;
            const name: null = null;
            const documentUri: null = null;
            const documentHashHex: null = null;
            const decimals = 0;
            const batonVout: null = null;
            const initialQuantity = new BigNumber("1.1");
            assert.throws(function () { SlpTokenType1.buildGenesisOpReturn(ticker, name, documentUri, documentHashHex, decimals, batonVout, initialQuantity); }, Error("bn not an integer"));
        });
        it("Throws when allocated OP_RETURN space is exceeded", () => {
            const ticker = "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
            const name = "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
            const documentUri = "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
            const documentHashHex: null = null;
            const decimals = 0;
            const batonVout: null = null;
            const initialQuantity = new BigNumber("18446744073709551615");
            assert.throws(function () { SlpTokenType1.buildGenesisOpReturn(ticker, name, documentUri, documentHashHex, decimals, batonVout, initialQuantity); }, Error("Script too long, must be less than or equal to 223 bytes."));
        });
        it("Succeeds with batonVout is 2 and max inital quantity is used", () => {
            const ticker = null;
            const name = null;
            const documentUri = null;
            const documentHashHex = null;
            const decimals = 0;
            const batonVout = 2;
            const initialQuantity = new BigNumber("18446744073709551615");
            let op_return = SlpTokenType1.buildGenesisOpReturn(ticker, name, documentUri, documentHashHex, decimals, batonVout, initialQuantity);
            assert.strictEqual(op_return.toString("hex"), "6a04534c500001010747454e455349534c004c004c004c000100010208ffffffffffffffff");
        });
        it("Throws when batonVout is less than 2", () => {
            const ticker: null = null;
            const name: null = null;
            const documentUri: null = null;
            const documentHashHex: null = null;
            const decimals = 0;
            const batonVout = 1;
            const initialQuantity = new BigNumber("18446744073709551615");
            assert.throws(function () { SlpTokenType1.buildGenesisOpReturn(ticker, name, documentUri, documentHashHex, decimals, batonVout, initialQuantity); }, Error("mintBatonVout out of range (0x02 < > 0xFF)"));
        });
        it("Throws when batonVout is zero", () => {
            const ticker: null = null;
            const name: null = null;
            const documentUri: null = null;
            const documentHashHex: null = null;
            const decimals = 0;
            const batonVout = 0;
            const initialQuantity = new BigNumber("18446744073709551615");
            assert.throws(() => {
                SlpTokenType1.buildGenesisOpReturn(ticker, name, documentUri, documentHashHex, decimals, batonVout, initialQuantity);
            }, Error("mintBatonVout out of range (0x02 < > 0xFF)"));
        });
        it("Throws when batonVout is negative", () => {
            const ticker: null = null;
            const name: null = null;
            const documentUri: null = null;
            const documentHashHex: null = null;
            const decimals = 0;
            const batonVout = -1;
            const initialQuantity = new BigNumber("18446744073709551615");
            // try {
            //     SlpTokenType1.buildGenesisOpReturn(ticker, name, documentUri, documentHashHex, decimals, batonVout, initialQuantity);
            // } catch(Err) {
            //     console.log(Err);
            //     console.log("done");
            // }
            assert.throws(() => {
                SlpTokenType1.buildGenesisOpReturn(ticker, name, documentUri, documentHashHex, decimals, batonVout, initialQuantity);
            }, Error("mintBatonVout out of range (0x02 < > 0xFF)"));
        });
        it("Throws when batonVout is greater than 255", () => {
            const ticker: null = null;
            const name: null = null;
            const documentUri: null = null;
            const documentHashHex: null = null;
            const decimals = 0;
            const batonVout = 256;
            const initialQuantity = new BigNumber("18446744073709551615");
            assert.throws(function () { SlpTokenType1.buildGenesisOpReturn(ticker, name, documentUri, documentHashHex, decimals, batonVout, initialQuantity); }, Error("mintBatonVout out of range (0x02 < > 0xFF)"));
        });
        it("Throws when decimals is too high", () => {
            const ticker: null = null;
            const name: null = null;
            const documentUri: null = null;
            const documentHashHex: null = null;
            const decimals = 10;
            const batonVout: null = null;
            const initialQuantity = new BigNumber("18446744073709551615");
            assert.throws(function () { SlpTokenType1.buildGenesisOpReturn(ticker, name, documentUri, documentHashHex, decimals, batonVout, initialQuantity); }, Error("decimals out of range"));
        });
        it("Throws when decimals is negative", () => {
            const ticker: null = null;
            const name: null = null;
            const documentUri: null = null;
            const documentHashHex: null = null;
            const decimals = -1;
            const batonVout: null = null;
            const initialQuantity = new BigNumber("18446744073709551615");
            assert.throws(function () { SlpTokenType1.buildGenesisOpReturn(ticker, name, documentUri, documentHashHex, decimals, batonVout, initialQuantity); }, Error("decimals out of range"));
        });
        it("Throws when decimals is null", () => {
            const ticker: null = null;
            const name: null = null;
            const documentUri: null = null;
            const documentHashHex: null = null;
            const decimals: any = null;
            const batonVout: null = null;
            const initialQuantity = new BigNumber("18446744073709551615");
            assert.throws(function () { SlpTokenType1.buildGenesisOpReturn(ticker, name, documentUri, documentHashHex, decimals as number, batonVout, initialQuantity); }, Error("Decimals property must be in range 0 to 9"));
        });
        it("Throws when initialQuantity is null", () => {
            const ticker: null = null;
            const name: null = null;
            const documentUri: null = null;
            const documentHashHex: null = null;
            const decimals = 0;
            const batonVout: null = null;
            const initialQuantity: any = null;
            assert.throws(function () { SlpTokenType1.buildGenesisOpReturn(ticker, name, documentUri, documentHashHex, decimals, batonVout, initialQuantity as BigNumber); }, TypeError("Cannot read property 'isInteger' of null"));
        });
        it("Throws when documentHashHex is provided as Buffer", () => {
            const ticker: null = null;
            const name: null = null;
            const documentUri: null = null;
            const documentHashHex: any = Buffer.from("00", "hex");
            const decimals = 0;
            const batonVout: null = null;
            const initialQuantity = new BigNumber("18446744073709551615");
            assert.throws(function () { SlpTokenType1.buildGenesisOpReturn(ticker, name, documentUri, documentHashHex as string, decimals, batonVout, initialQuantity); }, Error("documentHash must be either 0 or 32 hex bytes"));
        });
        it("Throws when documentHashHex is provided as non-hex string", () => {
            const ticker: null = null;
            const name: null = null;
            const documentUri: null = null;
            const documentHashHex = "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz";
            const decimals = 0;
            const batonVout: null = null;
            const initialQuantity = new BigNumber("18446744073709551615");
            assert.throws(function () { SlpTokenType1.buildGenesisOpReturn(ticker, name, documentUri, documentHashHex, decimals, batonVout, initialQuantity); }, Error("documentHash must be hex"));
        });
        it("Throws when ticker is not a string", () => {
            const ticker: any = ["a"];
            const name: null = null;
            const documentUri: null = null;
            const documentHashHex: null = null;
            const decimals = 0;
            const batonVout: null = null;
            const initialQuantity = new BigNumber("18446744073709551615");
            assert.throws(function () { SlpTokenType1.buildGenesisOpReturn(ticker as string, name, documentUri, documentHashHex, decimals, batonVout, initialQuantity); }, Error("ticker must be a string"));
        });
        it("Throws when name is not a string", () => {
            const ticker: null = null;
            const name: any = ["a"];
            const documentUri: null = null;
            const documentHashHex: null = null;
            const decimals = 0;
            const batonVout: null = null;
            const initialQuantity = new BigNumber("18446744073709551615");
            assert.throws(function () { SlpTokenType1.buildGenesisOpReturn(ticker, name as string, documentUri, documentHashHex, decimals, batonVout, initialQuantity); }, Error("name must be a string"));
        });
        it("Throws when documentUri is not a string", () => {
            const ticker: null = null;
            const name: null = null;
            const documentUri: any = 1;
            const documentHashHex: null = null;
            const decimals = 0;
            const batonVout: null = null;
            const initialQuantity = new BigNumber("18446744073709551615");
            assert.throws(function () { SlpTokenType1.buildGenesisOpReturn(ticker, name, documentUri as string, documentHashHex, decimals, batonVout, initialQuantity); }, TypeError("The first argument must be of type string or an instance of Buffer, ArrayBuffer, or Array or an Array-like Object. Received type number (1)"));
        });
        it("Throws when documentHashHex is not a string", () => {
            const ticker: null = null;
            const name: null = null;
            const documentUri: null = null;
            const documentHashHex: any = 1;
            const decimals = 0;
            const batonVout: null = null;
            const initialQuantity = new BigNumber("18446744073709551615");
            assert.throws(function () { SlpTokenType1.buildGenesisOpReturn(ticker, name, documentUri, documentHashHex as string, decimals, batonVout, initialQuantity); }, Error("documentHash must be either 0 or 32 hex bytes"));
        });
    });
    describe("buildSendOpReturn()", () => {
        it("Succeeds with 1 output", () => {
            const expectedResult = "6a04534c500001010453454e44208888888888888888888888888888888888888888888888888888888888888888080000000000000042";
            const tokenIdHex = "8888888888888888888888888888888888888888888888888888888888888888";
            const outputQtyArray = [ new BigNumber("66") ];
            const result = SlpTokenType1.buildSendOpReturn(tokenIdHex, outputQtyArray).toString("hex");
            assert.strictEqual(result, expectedResult);
        });
        it("Succeeds with 2 outputs", () => {
            const expectedResult = "6a04534c500001010453454e44208888888888888888888888888888888888888888888888888888888888888888080000000000000042080000000000000063";
            const tokenIdHex = "8888888888888888888888888888888888888888888888888888888888888888";
            const outputQtyArray = [ new BigNumber("66"), new BigNumber("99") ];
            const result = SlpTokenType1.buildSendOpReturn(tokenIdHex, outputQtyArray).toString("hex");
            assert.strictEqual(result, expectedResult);
        });
        it("Succeeds with 19 outputs", () => {
            const expectedResult = "6a04534c500001010453454e44208888888888888888888888888888888888888888888888888888888888888888080000000000000042080000000000000063080000000000000063080000000000000063080000000000000063080000000000000042080000000000000063080000000000000063080000000000000063080000000000000063080000000000000042080000000000000063080000000000000063080000000000000063080000000000000063080000000000000042080000000000000063080000000000000063080000000000000063";
            const tokenIdHex = "8888888888888888888888888888888888888888888888888888888888888888";
            const outputQtyArray = [ new BigNumber("66"), new BigNumber("99"), new BigNumber("99"), new BigNumber("99"), new BigNumber("99"),
                                    new BigNumber("66"), new BigNumber("99"), new BigNumber("99"), new BigNumber("99"), new BigNumber("99"),
                                    new BigNumber("66"), new BigNumber("99"), new BigNumber("99"), new BigNumber("99"), new BigNumber("99"),
                                    new BigNumber("66"), new BigNumber("99"), new BigNumber("99"), new BigNumber("99") ];
            const result = SlpTokenType1.buildSendOpReturn(tokenIdHex, outputQtyArray).toString("hex");
            assert.strictEqual(result, expectedResult);
        });
        it("Throws with 20 outputs", () => {
            const tokenIdHex = "8888888888888888888888888888888888888888888888888888888888888888";
            const outputQtyArray = [ new BigNumber("66"), new BigNumber("99"), new BigNumber("99"), new BigNumber("99"), new BigNumber("99"),
                                    new BigNumber("66"), new BigNumber("99"), new BigNumber("99"), new BigNumber("99"), new BigNumber("99"),
                                    new BigNumber("66"), new BigNumber("99"), new BigNumber("99"), new BigNumber("99"), new BigNumber("99"),
                                    new BigNumber("66"), new BigNumber("99"), new BigNumber("99"), new BigNumber("99"), new BigNumber("99") ];
            assert.throws(() => {SlpTokenType1.buildSendOpReturn(tokenIdHex, outputQtyArray);} , Error("too many slp amounts"));
        });
        it("Throws with 0 outputs", () => {
            const tokenIdHex = "8888888888888888888888888888888888888888888888888888888888888888";
            const outputQtyArray: any[] = [];
            assert.throws(() => {SlpTokenType1.buildSendOpReturn(tokenIdHex, outputQtyArray);}, Error("send requires at least one amount"));
        });
        it("Throws with null outputs", () => {
            const tokenIdHex = "8888888888888888888888888888888888888888888888888888888888888888";
            const outputQtyArray: any = null;
            assert.throws(() => {SlpTokenType1.buildSendOpReturn(tokenIdHex, outputQtyArray as BigNumber[]);}, TypeError);
        });
        it("Throws with BigNumber outputs", () => {
            const tokenIdHex = "8888888888888888888888888888888888888888888888888888888888888888";
            const outputQtyArray: any = new BigNumber("100");
            assert.throws(() => {SlpTokenType1.buildSendOpReturn(tokenIdHex, outputQtyArray as BigNumber[]);}, TypeError);
        });
        it("Throws with tokenIdHex too short", () => {
            const tokenIdHex = "88888888888888888888888888888888888888888888888888888888888888";
            const outputQtyArray = [ new BigNumber("66") ];
            assert.throws(() => {SlpTokenType1.buildSendOpReturn(tokenIdHex, outputQtyArray);}, Error("tokenIdHex does not pass regex"));
        });
        it("Throws with tokenIdHex too long", () => {
            const tokenIdHex = "888888888888888888888888888888888888888888888888888888888888888888";
            const outputQtyArray = [ new BigNumber("66") ];
            assert.throws(() => {SlpTokenType1.buildSendOpReturn(tokenIdHex, outputQtyArray);}, Error("tokenIdHex does not pass regex"));
        });
        it("Throws with tokenIdHex non-hex string", () => {
            const tokenIdHex = "zz88888888888888888888888888888888888888888888888888888888888888";
            const outputQtyArray = [ new BigNumber("66") ];
            assert.throws(() => {SlpTokenType1.buildSendOpReturn(tokenIdHex, outputQtyArray);}, Error("tokenIdHex does not pass regex"));
        });
        it("Throws with tokenIdHex not a string", () => {
            const tokenIdHex: any = 1;
            const outputQtyArray = [ new BigNumber("66") ];
            assert.throws(() => {SlpTokenType1.buildSendOpReturn(tokenIdHex as string, outputQtyArray);}, Error("tokenIdHex must be 32 bytes"));
        });
        it("Throws with tokenIdHex not as null", () => {
            const tokenIdHex: any = null;
            const outputQtyArray = [ new BigNumber("66") ];
            assert.throws(() => {SlpTokenType1.buildSendOpReturn(tokenIdHex as string, outputQtyArray);}, TypeError("Cannot read property 'length' of null"));
        });
    });
    describe("buildMintOpReturn()", () => {
        it("Succeeds when batonVout = null", () => {
            const expectedResult = "6a04534c50000101044d494e5420ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff4c00080000000000000064";
            const tokenIdHex = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
            const batonVout = null;
            const mintQuantity = new BigNumber("100");
            const result = SlpTokenType1.buildMintOpReturn(tokenIdHex, batonVout, mintQuantity).toString("hex");
            assert.strictEqual(result, expectedResult);
        });
        it("Succeeds when batonVout is 2", () => {
            const expectedResult = "6a04534c50000101044d494e5420ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0102080000000000000064";
            const tokenIdHex = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
            const batonVout = 2;
            const mintQuantity = new BigNumber("100");
            const result = SlpTokenType1.buildMintOpReturn(tokenIdHex, batonVout, mintQuantity).toString("hex");
            assert.strictEqual(result, expectedResult);
        });
        it("Throws when batonVout is 1", () => {
            const tokenIdHex = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
            const batonVout = 1;
            const mintQuantity = new BigNumber("66");
            //SlpTokenType1.buildMintOpReturn(tokenIdHex, batonVout, mintQuantity)
            assert.throws(() =>{SlpTokenType1.buildMintOpReturn(tokenIdHex, batonVout, mintQuantity);}, Error("mintBatonVout out of range (0x02 < > 0xFF)"));
        });
        it("Throws when batonVout is 256", () => {
            const tokenIdHex = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
            const batonVout = 256;
            const mintQuantity = new BigNumber("66");
            assert.throws(() =>{SlpTokenType1.buildMintOpReturn(tokenIdHex, batonVout, mintQuantity);}, Error("mintBatonVout out of range (0x02 < > 0xFF)"));
        });
        it("Throws when mintQuantity is a number", () => {
            const tokenIdHex = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
            const batonVout: null = null;
            const mintQuantity: any = 1;
            assert.throws(() =>{SlpTokenType1.buildMintOpReturn(tokenIdHex, batonVout, mintQuantity as BigNumber);}, TypeError("bn.isInteger is not a function"));
        });
        it("Throws when mintQuantity is null", () => {
            const tokenIdHex = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
            const batonVout: null = null;
            const mintQuantity: any = null;
            assert.throws(() =>{SlpTokenType1.buildMintOpReturn(tokenIdHex, batonVout, mintQuantity as BigNumber);}, TypeError("Cannot read property 'isInteger' of null"));
        });
        it("Throws when mintQuantity is too large", () => {
            const tokenIdHex = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
            const batonVout: null = null;
            const mintQuantity = new BigNumber("18446744073709551616");
            assert.throws(() =>{SlpTokenType1.buildMintOpReturn(tokenIdHex, batonVout, mintQuantity);}, Error("bn outside of range"));
        });
        it("Throws when mintQuantity is negative", () => {
            const tokenIdHex = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
            const batonVout: null = null;
            const mintQuantity = new BigNumber("-1");
            assert.throws(() =>{SlpTokenType1.buildMintOpReturn(tokenIdHex, batonVout, mintQuantity);}, Error("bn not positive integer"));
        });
        it("Throws when mintQuantity is decimal", () => {
            const tokenIdHex = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
            const batonVout: null = null;
            const mintQuantity = new BigNumber("1.1");
            assert.throws(() =>{SlpTokenType1.buildMintOpReturn(tokenIdHex, batonVout, mintQuantity);}, Error("bn not an integer"));
        });
        it("Throws when mintQuantity is array", () => {
            const tokenIdHex = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
            const batonVout: null = null;
            const mintQuantity: any = [ new BigNumber("1") ];
            assert.throws(() =>{SlpTokenType1.buildMintOpReturn(tokenIdHex, batonVout, mintQuantity as BigNumber);}, TypeError("bn.isInteger is not a function"));
        });
        it("Throws with tokenIdHex too short", () => {
            const tokenIdHex = "888888888888888888888888888888888888888888888888888888888888";
            const batonVout: null = null;
            const mintQuantity = new BigNumber("66");
            assert.throws(() => {SlpTokenType1.buildMintOpReturn(tokenIdHex, batonVout, mintQuantity);}, Error("tokenIdHex does not pass regex"));
        });
        it("Throws with tokenIdHex too long", () => {
            const tokenIdHex = "888888888888888888888888888888888888888888888888888888888888888888";
            const batonVout: null = null;
            const mintQuantity = new BigNumber("66");
            assert.throws(() => {SlpTokenType1.buildMintOpReturn(tokenIdHex, batonVout, mintQuantity);}, Error("tokenIdHex does not pass regex"));
        });
        it("Throws with tokenIdHex non-hex string", () => {
            const tokenIdHex = "zz88888888888888888888888888888888888888888888888888888888888888";
            const batonVout: null = null;
            const mintQuantity = new BigNumber("66");
            assert.throws(() => {SlpTokenType1.buildMintOpReturn(tokenIdHex, batonVout, mintQuantity);}, Error("tokenIdHex does not pass regex"));
        });
        it("Throws with tokenIdHex not a string", () => {
            const tokenIdHex: any = 1;
            const batonVout: null = null;
            const mintQuantity = new BigNumber("66");
            assert.throws(() => {SlpTokenType1.buildMintOpReturn(tokenIdHex as string, batonVout, mintQuantity);}, Error("tokenIdHex must be 32 bytes"));
        });
        it("Throws with tokenIdHex not as null", () => {
            const tokenIdHex: any = null;
            const batonVout: null = null;
            const mintQuantity = new BigNumber("66");
            assert.throws(() => {SlpTokenType1.buildMintOpReturn(tokenIdHex as string, batonVout, mintQuantity);}, TypeError("Cannot read property 'length' of null"));
        });
    });
});