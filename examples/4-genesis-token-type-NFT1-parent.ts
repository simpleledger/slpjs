/***************************************************************************************
 *
 *  Example 4: Genesis for NFT1 Parent - These are used to create individual NFT1 children
 *
 *  Instructions:
 *      (1) - Send some BCH to simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu
 *            or tBCH to slptest:qpwyc9jnwckntlpuslg7ncmhe2n423304ueqcyw80l
 *            to fund the example.
 *      (2) - Run `tsc && node <file-name.js>` just before script execution
 *      (3) - Optional: Use vscode debugger w/ launch.json settings
 *
 * ************************************************************************************/

import { BigNumber } from "bignumber.js";
import * as BITBOXSDK from "bitbox-sdk";
import { GrpcClient } from "grpc-bchrpc-node";
import { BchdNetwork, GetRawTransactionsAsync, LocalValidator, SlpBalancesResult } from "../index";

const name = "My NFT1 Group";
const ticker = "NFT1 Group";
const documentUri = null;
const documentHash: Buffer|null = null;
const initialTokenQty = 1000000;

(async () => {

    // // NETWORK: FOR MAINNET UNCOMMENT
    const BITBOX = new BITBOXSDK.BITBOX();
    const fundingAddress           = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu";  // <-- must be simpleledger format
    const fundingWif               = "L3gngkDg1HW5P9v5GdWWiCi3DWwvw5XnzjSPwNwVPN5DSck3AaiF";     // <-- compressed WIF format
    const tokenReceiverAddress     = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu";  // <-- must be simpleledger format
    const bchChangeReceiverAddress = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu";  // <-- cashAddr or slpAddr format
    // For unlimited issuance provide a "batonReceiverAddress"
    const batonReceiverAddress     = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu";

    // VALIDATOR SETUP: FOR REMOTE VALIDATION
    const client = new GrpcClient(); //{ url: "bchd.ny1.simpleledger.io" });

    const getRawTransactions: GetRawTransactionsAsync = async (txids: string[]) => {
        const txid = txids[0];
        const res = await client.getRawTransaction({ hash: txid, reversedHashOrder: true });
        return [Buffer.from(res.getTransaction_asU8()).toString("hex")];
    };
    const logger = console;
    const validator = new LocalValidator(BITBOX, getRawTransactions, logger);
    const bchdNetwork = new BchdNetwork({ BITBOX, client, validator, logger });

    // 1) Get all balances at the funding address.
    const balances = await bchdNetwork.getAllSlpBalancesAndUtxos(fundingAddress) as SlpBalancesResult;
    console.log("BCH balance:", balances.satoshis_available_bch);

    // 2) Calculate the token quantity with decimal precision included
    const initialTokenQtyBN = new BigNumber(initialTokenQty);

    // 3) Set private keys
    balances!.nonSlpUtxos.forEach(txo => txo.wif = fundingWif);

    // 4) Use "simpleTokenGenesis()" helper method
    const genesisTxid = await bchdNetwork.simpleNFT1ParentGenesis(
            name,
            ticker,
            initialTokenQtyBN,
            documentUri,
            documentHash,
            tokenReceiverAddress,
            batonReceiverAddress,
            bchChangeReceiverAddress,
            balances!.nonSlpUtxos,
            );
    console.log("NFT1 Parent GENESIS txn complete:", genesisTxid);
})();
