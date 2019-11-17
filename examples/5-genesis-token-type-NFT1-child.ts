/***************************************************************************************
 *
 *  Example 5: Genesis for a single NFT1 Child - Must have NFT1 parent first
 *
 *  Instructions:
 *      (1) - Send some BCH to simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu
 *            or tBCH to slptest:qpwyc9jnwckntlpuslg7ncmhe2n423304ueqcyw80l
 *            to fund the example.
 *      (2) - Select Network and Address by commenting/uncommenting the desired
 *              NETWORK section and providing valid BCH address.
 *      (3) - Select a Validation method by commenting/uncommenting the desired
 *              VALIDATOR section. Chose from remote validator or local validator.
 *              Both options rely on remote JSON RPC calls to rest.bitcoin.com.
 *      (4) - Run `tsc && node <file-name.js>` just before script execution
 *      (5) - Optional: Use vscode debugger w/ launch.json settings
 *
 * ************************************************************************************/

import { BigNumber } from "bignumber.js";
import * as BITBOXSDK from "bitbox-sdk";
import { GrpcClient } from "grpc-bchrpc-node";
import { BitboxNetwork, GetRawTransactionsAsync, LocalValidator, SlpAddressUtxoResult, SlpBalancesResult } from "../index";

const name = "My NFT1 Child";
const ticker = "NFT1 Child";
const documentUri: string|null = null;
const documentHash: Buffer|null = null;
const NFT1ParentGroupID = "112f967519e18083c8e4bd7ba67ebc04d72aaaa941826d38655c53d677e6a5be";

(async () => {

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // // NETWORK: FOR MAINNET UNCOMMENT
    const BITBOX = new BITBOXSDK.BITBOX({ restURL: "https://rest.bitcoin.com/v2/" });
    const fundingAddress           = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu";  // <-- must be simpleledger format
    const fundingWif               = "L3gngkDg1HW5P9v5GdWWiCi3DWwvw5XnzjSPwNwVPN5DSck3AaiF";     // <-- compressed WIF format
    const tokenReceiverAddress     = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu";  // <-- must be simpleledger format
    const bchChangeReceiverAddress = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu";  // <-- cashAddr or slpAddr format
    // For unlimited issuance provide a "batonReceiverAddress"
    const batonReceiverAddress     = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu";

    // NETWORK: FOR TESTNET UNCOMMENT
    // const BITBOX = new BITBOXSDK.BITBOX({ restURL: 'https://trest.bitcoin.com/v2/' });
    // const fundingAddress           = "slptest:qpwyc9jnwckntlpuslg7ncmhe2n423304ueqcyw80l";
    // const fundingWif               = "cVjzvdHGfQDtBEq7oddDRcpzpYuvNtPbWdi8tKQLcZae65G4zGgy";
    // const tokenReceiverAddress     = "slptest:qpwyc9jnwckntlpuslg7ncmhe2n423304ueqcyw80l";
    // const bchChangeReceiverAddress = "slptest:qpwyc9jnwckntlpuslg7ncmhe2n423304ueqcyw80l";
    // // For unlimited issuance provide a "batonReceiverAddress"
    // const batonReceiverAddress     = "slptest:qpwyc9jnwckntlpuslg7ncmhe2n423304ueqcyw80l";

    // VALIDATOR: FOR REMOTE VALIDATION
    //const bitboxNetwork = new BitboxNetwork(BITBOX);

    // VALIDATOR: FOR LOCAL VALIDATOR / REMOTE JSON RPC
    const grpc = new GrpcClient();
    const getRawTransactions: GetRawTransactionsAsync = async (txids: string[]) => {
        const txid = txids[0];
        const res = await grpc.getRawTransaction({ hash: txid, reversedHashOrder: true });
        return [Buffer.from(res.getTransaction_asU8()).toString("hex")];
        //return <string[]>await BITBOX.RawTransactions.getRawTransaction(txids)  // <--- alternative to gRPC
    };
    const logger = console;
    const slpValidator = new LocalValidator(BITBOX, getRawTransactions, logger);
    const bitboxNetwork = new BitboxNetwork(BITBOX, slpValidator);

    // Get all balances at the funding address.
    let balances = await bitboxNetwork.getAllSlpBalancesAndUtxos(fundingAddress) as SlpBalancesResult;
    console.log("'balances' variable is set.");
    console.log("BCH balance:", balances.satoshis_available_bch);

    // Look at the NFT1 Parent token balance.  Make sure its greater than 0.
    if (!balances.slpTokenBalances[NFT1ParentGroupID] ||
        !balances.slpTokenBalances[NFT1ParentGroupID].isGreaterThan(0)) {
        throw Error("Insufficient balance of NFT1 tokens, first you need to create NFT1 parent at this address.");
    }

    // Try to find an NFT parent that has quantity equal to 1
    let utxo: SlpAddressUtxoResult|undefined;
    balances.slpTokenUtxos[NFT1ParentGroupID].forEach(txo => {
        if (!utxo && txo.slpUtxoJudgementAmount.isEqualTo(1)) {
            utxo = txo;
        }
    });

    // If there wasn't any NFT1 parent UTXO with quantity of 1, so we create a TXO w/ qty 1 to be burned.
    if (!utxo) {
        const inputs = [...balances.nonSlpUtxos, ...balances.slpTokenUtxos[NFT1ParentGroupID]];
        inputs.map(txo => txo.wif = fundingWif);
        const sendTxid = await bitboxNetwork.simpleTokenSend(
                                                NFT1ParentGroupID, new BigNumber(1), inputs,
                                                tokenReceiverAddress, tokenReceiverAddress);

        // wait for transaction to hit the full node.
        console.log("Created new parent UTXO to burn:", sendTxid);
        console.log("Waiting for the Full Node to sync with transaction...");
        await sleep(3000);

        // update balances and set the newly created parent TXO.
        balances = (await bitboxNetwork.getAllSlpBalancesAndUtxos(fundingAddress) as SlpBalancesResult);
        balances.slpTokenUtxos[NFT1ParentGroupID].forEach(txo => {
            if (!utxo && txo.slpUtxoJudgementAmount.isEqualTo(1)) {
                utxo = txo;
            }
        });
    }

    // 3) Set private keys
    const inputs = [utxo!, ...balances.nonSlpUtxos];
    inputs.map(txo => txo.wif = fundingWif);

    // 4) Use "simpleTokenGenesis()" helper method
    const genesisTxid = await bitboxNetwork.simpleNFT1ChildGenesis(
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
