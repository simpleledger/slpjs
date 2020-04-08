/***************************************************************************************
 *
 *  Example 2: Fetch token details for given txid
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

import * as BITBOXSDK from "bitbox-sdk";
import { BchdNetwork } from "../index";
import { GetRawTransactionsAsync } from "../lib/localvalidator";
import { GrpcClient } from "grpc-bchrpc-node";
import { TrustedValidator } from "../lib/trustedvalidator";

const BITBOX = new BITBOXSDK.BITBOX();
const logger = console;

// NETWORK: FOR MAINNET COMMENT/UNCOMMENT
let txid = "c67c6423767a86e27c56ad9c04581f4500d88baff12b865611a39602f449b465";
const testnet = false;

// VALIDATOR: FOR LOCAL VALIDATOR
const client = new GrpcClient({testnet});

// VALIDATOR: FOR LOCAL VALIDATOR
const getRawTransactions: GetRawTransactionsAsync = async (txids: string[]) => {
    const getRawTransaction = async (txid: string) => {
        console.log(`Downloading: ${txid}`);
        return await client.getRawTransaction({hash: txid, reversedHashOrder: true});
    };
    return (await Promise.all(
        txids.map((txid) => getRawTransaction(txid))))
        .map((res) => Buffer.from(res.getTransaction_asU8()).toString("hex"));
};

// NOTE: for testnet you would need to set a testnet slpdbUrl
const validator = new TrustedValidator({ getRawTransactions, logger });
const network = new BchdNetwork({ BITBOX, client, validator });

(async () => {
    const details = await network.getTransactionDetails(txid);
    console.log("Transaction SLP details: ", details);
})();
