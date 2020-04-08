/***************************************************************************************
 *
 *  Example 1a: Fetch token balances for an address
 *              using BCHD and SLPDB Trusted Validation
 *
 *  Instructions:
 *      (1) - Select Network and Address by commenting/uncommenting the desired
 *              TESTNET or MAINNET section and providing valid BCH address.
 *      (2) - Run `ts-node <file-name.js>` just before script execution,
 *            or use vscode debugger w/ launch.json settings for "Current TS File"
 *
 * ************************************************************************************/

import * as BITBOXSDK from "bitbox-sdk";
const BITBOX = new BITBOXSDK.BITBOX();
import { GrpcClient } from "grpc-bchrpc-node";
import { BchdNetwork, GetRawTransactionsAsync, SlpBalancesResult, TrustedValidator } from "../index";

// MAINNET NETWORK
const addr = "simpleledger:qp4a73gx6j5u3se0f7263us6rdxygh3rfvk0gu9mfa";
const testnet = false;

// TESTNET NETWORK
// const addr = "slptest:qrzp09cnyysvsjc0s63kflmdmewuuwvs4gc8h7uh86";
// const testnet = true;

// NOTE: you will want to override the "url" parameter with a local node in production use,
const client = new GrpcClient({testnet});
const logger = console;
const getRawTransactions: GetRawTransactionsAsync = async (txids: string[]) => {
    const getRawTransaction = async (txid: string) => {
        console.log(`Downloading: ${txid}`);
        return await client.getRawTransaction({hash: txid, reversedHashOrder: true});
    };
    return (await Promise.all(
        txids.map((txid) => getRawTransaction(txid))))
        .map((res) => Buffer.from(res.getTransaction_asU8()).toString("hex"));
};
const validator = new TrustedValidator({logger, getRawTransactions});
const network = new BchdNetwork({BITBOX, client, validator});

(async () => {
    console.log(`Checking balances for ${addr}`);
    const balances = (await network.getAllSlpBalancesAndUtxos(addr)) as SlpBalancesResult;
    let counter = 0;
    for (const key in balances.slpTokenBalances) {
        counter++;
        const tokenInfo = await network.getTokenInformation(key);
        console.log(`TokenId: ${key}, SLP Type: ${tokenInfo.versionType}, Balance: ${balances.slpTokenBalances[key].div(10 ** tokenInfo.decimals).toFixed(tokenInfo.decimals)}`);
    }
    for (const key in balances.nftParentChildBalances) {
        counter++;
        // TODO ...
    }
    if (counter === 0) {
        console.log("No tokens found for this address.");
    }
})();
