/***************************************************************************************
 * 
 *  Example 10: Burn any type of token.
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

(async function() {
    
    // NETWORK: FOR MAINNET
    const BITBOX = new BITBOXSDK.BITBOX({ restURL: 'https://rest.bitcoin.com/v2/' });
    const fundingAddress           = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu"; // <-- must be simpleledger format
    const fundingWif               = "L3gngkDg1HW5P9v5GdWWiCi3DWwvw5XnzjSPwNwVPN5DSck3AaiF";    // <-- compressed WIF format
    const bchChangeReceiverAddress = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu"; // <-- must be simpleledger format
    let tokenId = "d32b4191d3f78909f43a3f5853ba59e9f2d137925f28e7780e717f4b4bfd4a3f";
    let burnAmount = 1;

    const bitboxNetwork = new BitboxNetwork(BITBOX);

    // 1) Fetch critical token information
    const tokenInfo = await bitboxNetwork.getTokenInformation(tokenId);
    let tokenDecimals = tokenInfo.decimals; 
    console.log('Token precision:', tokenDecimals.toString());

    // 2) Check that token balance is greater than our desired sendAmount
    let balances = <SlpBalancesResult>await bitboxNetwork.getAllSlpBalancesAndUtxos(fundingAddress);
    console.log("'balances' variable is set.");
    if(balances.slpTokenBalances[tokenId])
        console.log('Token balance:', <any>balances.slpTokenBalances[tokenId].toFixed() / 10**tokenDecimals)
    else
        console.log("Funding addresss is not holding any tokens with id:", tokenId);

    // 3) Calculate send amount in "Token Satoshis".  In this example we want to just send 1 token unit to someone...
    let amount = (new BigNumber(burnAmount)).times(10**tokenDecimals);  // Don't forget to account for token precision

    // 4) Get all of our token's UTXOs
    let inputUtxos = balances.slpTokenUtxos[tokenId];

    // 5) Simply sweep our BCH utxos to fuel the transaction
    inputUtxos = inputUtxos.concat(balances.nonSlpUtxos);

    // 6) Set the proper private key for each Utxo
    inputUtxos.forEach(txo => txo.wif = fundingWif)

    // 7) Send token
    let sendTxid  = await bitboxNetwork.simpleTokenBurn(
            tokenId, 
            amount, 
            inputUtxos, 
            bchChangeReceiverAddress
        )
    console.log("BURN txn complete:",sendTxid);
})();
