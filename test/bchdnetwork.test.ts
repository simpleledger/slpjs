import * as assert from "assert";
import { BigNumber } from "bignumber.js";
import { BITBOX } from "bitbox-sdk";
import { GrpcClient } from "grpc-bchrpc-node";
import { BchdNetwork } from "../lib/bchdnetwork";
import { GetRawTransactionsAsync, LocalValidator } from "../lib/localvalidator";

describe("BchdNetwork (mainnet)", () => {
    const bitbox = new BITBOX();
    describe("getTokenInformation()", () => {
        const client = new GrpcClient();
        const getRawTransactions: GetRawTransactionsAsync = async (txids: string[]) => {
            const getRawTransaction = async (txid: string) => {
                console.log(`Downloading: ${txid}`);
                return await client.getRawTransaction({hash: txid, reversedHashOrder: true});
            };
            return (await Promise.all(
                txids.map((txid) => getRawTransaction(txid))))
                .map((res) => Buffer.from(res.getTransaction_asU8()).toString("hex"));
        };

        const logger = console;
        const validator = new LocalValidator(bitbox, getRawTransactions, logger);
        const network = new BchdNetwork({BITBOX: bitbox, client, validator, logger});
        it("returns token information for a given valid tokenId", async () => {
            const tokenId = "667b28d5885717e6d164c832504ae6b0c4db3c92072119ddfc5ff0db2c433456";
            const tokenInfo = await network.getTokenInformation(tokenId, true);
            const expectedTokenInfo = {
                tokenIdHex: "667b28d5885717e6d164c832504ae6b0c4db3c92072119ddfc5ff0db2c433456",
                transactionType: "GENESIS",
                versionType: 1,
                symbol: "BCH",
                name: "Bitcoin Cash",
                documentUri: "",
                documentSha256: null,
                decimals: 8,
                containsBaton: true,
                batonVout: 2,
                genesisOrMintQuantity: new BigNumber("21000000"),
            };
            assert.deepEqual(tokenInfo, expectedTokenInfo);
        });
        it("throws when tokenId is not found", async () => {
            const tokenId = "000028d5885717e6d164c832504ae6b0c4db3c92072119ddfc5ff0db2c433456";
            let threw = false;
            try {
                await network.getTokenInformation(tokenId);
            } catch (error) {
                threw = true;
                assert.equal(error.message, "5 NOT_FOUND: transaction not found");
            } finally { assert.equal(threw, true); }
        });
    });
});
