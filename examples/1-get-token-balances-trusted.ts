/***************************************************************************************
 *
 *  Example 1a: Fetch token balances for an address using a trusted validator.
 *
 *  Instructions:
 *      (1) - Select Network and Address by commenting/uncommenting the desired
 *              NETWORK section and providing valid BCH address.
 *      (2) - Select a Validation method by commenting/uncommenting the desired
 *              VALIDATOR section. Chose from remote validator or local validator.
 *              Both options rely on remote JSON RPC calls to rest.bitcoin.com.
 *      (3) - Run `tsc && node <file-name.js>` just before script execution
 *      (4) - Optional: Use vscode debugger w/ launch.json settings
 *
 * ************************************************************************************/

import { grpc } from "@improbable-eng/grpc-web";
import { NodeHttpTransport } from "@improbable-eng/grpc-web-node-http-transport";
// Do this first, so that we can call this library from node.js evironment.
grpc.setDefaultTransport(NodeHttpTransport());

import * as BITBOXSDK from "bitbox-sdk";
import { BchdNetwork, TrustedValidator } from "../index";

import { GrpcClient } from "grpc-bchrpc-web";
const client = new GrpcClient();
const BITBOX = new BITBOXSDK.BITBOX();
const validator = new TrustedValidator({});
const network = new BchdNetwork({ BITBOX, client, validator });
const addr = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu";
const logger = console;

(async () => {
    const balances = await network.getAllSlpBalancesAndUtxos(addr);
    console.log("balances: ", balances);
})();
