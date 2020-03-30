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

import { grpc } from "@improbable-eng/grpc-web";
import { NodeHttpTransport } from "@improbable-eng/grpc-web-node-http-transport";
// Do this first, so that we can call this library from node.js evironment.
grpc.setDefaultTransport(NodeHttpTransport());

import * as BITBOXSDK from "bitbox-sdk";
const BITBOX = new BITBOXSDK.BITBOX();
import { GrpcClient } from "grpc-bchrpc-web";
import { BchdNetwork, SlpBalancesResult, TrustedValidator } from "../index";

// MAINNET NETWORK
const addr = "simpleledger:qp4a73gx6j5u3se0f7263us6rdxygh3rfvk0gu9mfa";
const testnet = false;

// TESTNET NETWORK
// const addr = "slptest:qrzp09cnyysvsjc0s63kflmdmewuuwvs4gc8h7uh86";
// const testnet = true;

// NOTE: you will want to override the "url" parameter with a local node in production use,
const client = new GrpcClient({testnet});

const logger = console;
const validator = new TrustedValidator({logger});
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
