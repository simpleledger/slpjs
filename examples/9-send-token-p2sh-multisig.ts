/***************************************************************************************
 * 
 *  Example 9: Send any type of token using P2SH multisig
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
import { BitboxNetwork, SlpBalancesResult, Slp, TransactionHelpers } from '../index';

(async function() {
    
    const BITBOX = new BITBOXSDK.BITBOX({ restURL: 'https://rest.bitcoin.com/v2/' });
    const slp = new Slp(BITBOX);
    const helpers = new TransactionHelpers(slp);

    const pubkey_signer_1 = "02471e07bcf7d47afd40e0bf4f806347f9e8af4dfbbb3c45691bbaefd4ea926307"; // Signer #1
    const pubkey_signer_2 = "03472cfca5da3bf06a85c5fd860ffe911ef374cf2a9b754fd861d1ead668b15a32"; // Signer #2

    // we have two signers for this 2-of-2 multisig address (so for the missing key we can just put "null")
    const wifs = ["Ky6iiLSL2K9stMd4G5dLeXfpVKu5YRB6dhjCsHyof3eaB2cDngSr", "L2AdfmxwsYu3KnRASZ51C3UEnduUDy1b21sSF9JbLNVEPzsxEZib"] //[ "Ky6iiLSL2K9stMd4G5dLeXfpVKu5YRB6dhjCsHyof3eaB2cDngSr", null ];

    // to keep this example alive we will just send everything to the same address
    const tokenReceiverAddress     = [ "simpleledger:pphnuh7dx24rcwjkj0sl6xqfyfzf23aj7udr0837gn" ]; // <-- must be simpleledger format
    const bchChangeReceiverAddress = "simpleledger:pphnuh7dx24rcwjkj0sl6xqfyfzf23aj7udr0837gn";     // <-- must be simpleledger format
    let tokenId = "497291b8a1dfe69c8daea50677a3d31a5ef0e9484d8bebb610dac64bbc202fb7";
    var sendAmounts: number[]|BigNumber[] = [ 1 ];

    const bitboxNetwork = new BitboxNetwork(BITBOX);

    // 1) Fetch critical token information
    const tokenInfo = await bitboxNetwork.getTokenInformation(tokenId);
    let tokenDecimals = tokenInfo.decimals; 
    console.log("Token precision: " + tokenDecimals.toString());

    // Wait for network responses...

    // 2) Check that token balance is greater than our desired sendAmount
    let fundingAddress = "simpleledger:pphnuh7dx24rcwjkj0sl6xqfyfzf23aj7udr0837gn";
    let balances = <SlpBalancesResult>await bitboxNetwork.getAllSlpBalancesAndUtxos(fundingAddress);
    console.log("'balances' variable is set.");
    console.log(balances);
    if(balances.slpTokenBalances[tokenId] === undefined)
        console.log("You need to fund the addresses provided in this example with tokens and BCH.  Change the tokenId as required.")
    console.log("Token balance:", <any>balances.slpTokenBalances[tokenId].toFixed() / 10**tokenDecimals);

    // Wait for network responses...

    // 3) Calculate send amount in "Token Satoshis".  In this example we want to just send 1 token unit to someone...
    sendAmounts = <BigNumber[]>sendAmounts.map(a => (new BigNumber(a)).times(10**tokenDecimals));  // Don't forget to account for token precision

    // 4) Get all of our token's UTXOs
    let inputUtxos = balances.slpTokenUtxos[tokenId];

    // 5) Simply sweep our BCH utxos to fuel the transaction
    inputUtxos = inputUtxos.concat(balances.nonSlpUtxos);

    // 6) Estimate the additional fee for our larger p2sh scriptSigs
    let extraFee = (2 * 33 +            // two pub keys in each redeemScript
                    2 * 72 +            // two signatures in scriptSig
                    10) *               // for OP_CMS and various length bytes
                    inputUtxos.length   // this many times since we swept inputs from p2sh address

    // 7) Build an unsigned transaction
    let unsignedTxnHex = helpers.simpleTokenSend({ tokenId, sendAmounts, inputUtxos, tokenReceiverAddresses: tokenReceiverAddress, changeReceiverAddress: bchChangeReceiverAddress, extraFee });

    // 8) Build scriptSigs for all intputs
    let redeemData = helpers.build_P2SH_multisig_redeem_data(2, [pubkey_signer_1, pubkey_signer_2]);
    let scriptSigs = inputUtxos.map((txo, i) => {
        let sigData = redeemData.pubKeys.map((pk, j) => {
            if(wifs[j]) {
                return helpers.get_transaction_sig_p2sh(unsignedTxnHex, wifs[j]!, i, txo.satoshis, redeemData.lockingScript, redeemData.lockingScript)
            }
            else {
                return helpers.get_transaction_sig_filler(i, pk)
            }
        })
        return helpers.build_P2SH_multisig_scriptSig(redeemData, i, sigData)
    })

    // 9) apply our scriptSigs to the unsigned transaction
    let signedTxn = helpers.addScriptSigs(unsignedTxnHex, scriptSigs);

    // 10) OPTIONAL: Update transaction hex with input values to allow for our second signer who is using Electron Cash SLP edition (https://simpleledger.cash/project/electron-cash-slp-edition/)
    //let input_values = inputUtxos.map(txo => txo.satoshis)
    //signedTxn = helpers.insert_input_values_for_EC_signers(signedTxn, input_values)

    // 11) Send token
    let sendTxid = await bitboxNetwork.sendTx(signedTxn)
    console.log("SEND txn complete:", sendTxid);

})();
