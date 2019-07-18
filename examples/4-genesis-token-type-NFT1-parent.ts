/***************************************************************************************
 * 
 *  Example 4: Genesis for NFT1 Parent - These are used to create individual NFT1 children
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

import * as BITBOXSDK from 'bitbox-sdk';
import { BigNumber } from 'bignumber.js';
import { BitboxNetwork, SlpBalancesResult } from '../index';

let name = "My NFT1 Group";
let ticker = "NFT1 Group";
let documentUri = null;
let documentHash: Buffer|null = null;
let initialTokenQty = 1000000;

(async function() {
    // // NETWORK: FOR MAINNET UNCOMMENT
    const BITBOX = new BITBOXSDK.BITBOX({ restURL: 'https://rest.bitcoin.com/v2/' });
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
    let balances = <SlpBalancesResult>await bitboxNetwork.getAllSlpBalancesAndUtxos(fundingAddress);
    console.log("'balances' variable is set.");
    console.log('BCH balance:', balances.satoshis_available_bch);

    // 2) Calculate the token quantity with decimal precision included
    let initialTokenQtyBN = new BigNumber(initialTokenQty);

    // 3) Set private keys
    balances!.nonSlpUtxos.forEach(txo => txo.wif = fundingWif)

    // 4) Use "simpleTokenGenesis()" helper method
    let genesisTxid = await bitboxNetwork.simpleNFT1ParentGenesis(
            name, 
            ticker, 
            initialTokenQtyBN,
            documentUri,
            documentHash,
            tokenReceiverAddress,
            batonReceiverAddress,
            bchChangeReceiverAddress,
            balances!.nonSlpUtxos
            )
    console.log("NFT1 Parent GENESIS txn complete:", genesisTxid)
})()
