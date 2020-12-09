/***************************************************************************************
 *
 *  Example 3: Genesis for SLP Token Type 1
 *
 *  Instructions:
 *      (1) - Send some BCH to simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu
 *            or tBCH to slptest:qpwyc9jnwckntlpuslg7ncmhe2n423304ueqcyw80l
*             to fund the example.
 *      (2) - Select Network and Address by commenting/un-commenting the desired
 *              NETWORK section and providing valid BCH address.
 *      (3) - Select a Validation method by commenting/un-commenting the desired
 *              VALIDATOR section. Chose from remote validator or local validator.
 *              Both options rely on remote JSON RPC calls to rest.bitcoin.com.
 *      (4) - Run `tsc && node <file-name.js>` just before script execution
 *      (5) - Optional: Use vscode debugger w/ launch.json settings
 *
 * ************************************************************************************/

import { BigNumber } from "bignumber.js";
import * as BITBOXSDK from "bitbox-sdk";
import { BitboxNetwork, SlpBalancesResult } from "../index";

const decimals = 2;
const name = "Awesome SLPJS README Token";
const ticker = "SLPJS";
const documentUri = "info@simpleledger.io";
const documentHash: Buffer|null = null;
const initialTokenQty = 1000000;

(async () => {

    // NETWORK: FOR MAINNET UNCOMMENT
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

    const bitboxNetwork = new BitboxNetwork(BITBOX);

    // 1) Get all balances at the funding address.
    const balances = await bitboxNetwork.getAllSlpBalancesAndUtxos(fundingAddress) as SlpBalancesResult;
    console.log("BCH balance:", balances.satoshis_available_bch);

    // 2) Calculate the token quantity with decimal precision included
    const initialTokenQtyBN = (new BigNumber(initialTokenQty)).times(10 ** decimals);

    // 3) Set private keys
    balances!.nonSlpUtxos.forEach((txo) => txo.wif = fundingWif);

    // 4) Use "simpleTokenGenesis()" helper method
    const genesisTxid = await bitboxNetwork.simpleTokenGenesis(
            name,
            ticker,
            initialTokenQtyBN,
            documentUri,
            documentHash,
            decimals,
            tokenReceiverAddress,
            batonReceiverAddress,
            bchChangeReceiverAddress,
            balances!.nonSlpUtxos,
            );
    console.log("GENESIS txn complete:", genesisTxid);
})();
