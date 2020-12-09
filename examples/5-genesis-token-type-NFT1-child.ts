/***************************************************************************************
 *
 *  Example 5: Genesis for a single NFT1 Child - Must have NFT1 parent first
 *
 *  Instructions:
 *      (1) - Send some BCH to simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu
 *            or tBCH to slptest:qpwyc9jnwckntlpuslg7ncmhe2n423304ueqcyw80l
 *            to fund the example.
 *      (2) - Run `tsc && node <file-name.js>` just before script execution
 *      (3) - Optional: Use a custom SLP validator by using GrpcClient "url" parameter
 *      (4) - Optional: Use vscode debugger w/ launch.json settings
 *
 * ************************************************************************************/

import { BigNumber } from "bignumber.js";
import * as BITBOXSDK from "bitbox-sdk";
import { GrpcClient } from "grpc-bchrpc-node";
import { GetRawTransactionsAsync,
            LocalValidator,
            SlpAddressUtxoResult,
            SlpBalancesResult } from "../index";
import { BchdNetwork } from "../lib/bchdnetwork";

const name = "My NFT1 Child";
const ticker = "NFT1 Child";
const documentUri: string|null = null;
const documentHash: Buffer|null = null;
const NFT1ParentGroupID = "240c44216936e86e624538866934c6f038a6cc4a5a83db232d735f15e400b7ad";

(async () => {

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    // // NETWORK: FOR MAINNET UNCOMMENT
    const BITBOX = new BITBOXSDK.BITBOX();
    const fundingAddress           = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu";  // <-- must be simpleledger format
    const fundingWif               = "L3gngkDg1HW5P9v5GdWWiCi3DWwvw5XnzjSPwNwVPN5DSck3AaiF";     // <-- compressed WIF format
    const tokenReceiverAddress     = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu";  // <-- must be simpleledger format
    const bchChangeReceiverAddress = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu";  // <-- cashAddr or slpAddr format

    // VALIDATOR SETUP: FOR REMOTE VALIDATION
    const client = new GrpcClient();
    const getRawTransactions: GetRawTransactionsAsync = async (txids: string[]) => {
        const txid = txids[0];
        const res = await client.getRawTransaction({ hash: txid, reversedHashOrder: true });
        return [Buffer.from(res.getTransaction_asU8()).toString("hex")];
    };
    const logger = console;
    const validator = new LocalValidator(BITBOX, getRawTransactions, logger);
    const bchdNetwork = new BchdNetwork({ BITBOX, client, validator });

    // Get all balances at the funding address.
    let balances = await bchdNetwork.getAllSlpBalancesAndUtxos(fundingAddress) as SlpBalancesResult;
    console.log("BCH balance:", balances.satoshis_available_bch);

    // Look at the NFT1 Parent token balance.  Make sure its greater than 0.
    if (!balances.slpTokenBalances[NFT1ParentGroupID] ||
        !balances.slpTokenBalances[NFT1ParentGroupID].isGreaterThan(0)) {
        throw Error("Insufficient balance of NFT1 tokens, first you need to create NFT1 parent at this address.");
    }

    // Try to find an NFT parent that has quantity equal to 1
    let nftGroupUtxo: SlpAddressUtxoResult|undefined;
    balances.slpTokenUtxos[NFT1ParentGroupID].forEach((txo) => {
        if (!nftGroupUtxo && txo.slpUtxoJudgementAmount.isEqualTo(1)) {
            nftGroupUtxo = txo;
        }
    });

    // If there wasn't any NFT1 parent UTXO with quantity of 1, so we create a TXO w/ qty 1 to be burned.
    if (!nftGroupUtxo) {
        const inputs = [...balances.nonSlpUtxos, ...balances.slpTokenUtxos[NFT1ParentGroupID]];
        inputs.map((txo) => txo.wif = fundingWif);
        const sendTxid = await bchdNetwork.simpleTokenSend(
                                                NFT1ParentGroupID, new BigNumber(1), inputs,
                                                tokenReceiverAddress, tokenReceiverAddress);

        // wait for transaction to hit the full node.
        console.log("Created new parent UTXO to burn:", sendTxid);
        console.log("Waiting for the Full Node to sync with transaction...");
        await sleep(3000);

        // update balances and set the newly created parent TXO.
        balances = (await bchdNetwork.getAllSlpBalancesAndUtxos(fundingAddress) as SlpBalancesResult);
        balances.slpTokenUtxos[NFT1ParentGroupID].forEach(txo => {
            if (!nftGroupUtxo && txo.slpUtxoJudgementAmount.isEqualTo(1)) {
                nftGroupUtxo = txo;
            }
        });
    }

    // 3) Set private keys
    const inputs = [nftGroupUtxo!, ...balances.nonSlpUtxos];
    inputs.map((txo) => txo.wif = fundingWif);

    // 4) Use "simpleNFT1ChildGenesis()" helper method
    const genesisTxid = await bchdNetwork.simpleNFT1ChildGenesis(
            NFT1ParentGroupID,
            name,
            ticker,
            documentUri,
            documentHash,
            tokenReceiverAddress,
            bchChangeReceiverAddress,
            inputs,
            );

    console.log("NFT1 Child GENESIS txn complete:", genesisTxid);
})();
