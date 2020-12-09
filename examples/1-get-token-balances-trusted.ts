/***************************************************************************************
 *
 *  Example 1a: Fetch token balances for an address
 *              using BCHD and SLPDB Trusted Validation
 *
 *  Instructions:
 *      (1) - Select Network and Address by commenting/un-commenting the desired
 *              TESTNET or MAINNET section and providing valid BCH address.
 *      (2) - Run `ts-node <file-name.js>` just before script execution,
 *            or use vscode debugger w/ launch.json settings for "Current TS File"
 *
 * ************************************************************************************/

import * as BITBOXSDK from "bitbox-sdk";
const BITBOX = new BITBOXSDK.BITBOX();
import { GrpcClient } from "grpc-bchrpc-node";
import { BchdNetwork, BchdValidator, SlpBalancesResult } from "../index";

const addr = "simpleledger:qpcgsyu3c4hd00luwhc5a9x5zcgnlw8kdqmdxyjsta";

const client = new GrpcClient({ url: "bchd.ny1.simpleledger.io" });
const validator = new BchdValidator(client);
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
