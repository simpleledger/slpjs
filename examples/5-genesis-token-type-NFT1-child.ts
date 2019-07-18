/***************************************************************************************
 * 
 *  Example 5: Genesis for a single NFT1 Child - Must have NFT1 parent first
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
import { BitboxNetwork, SlpBalancesResult, SlpAddressUtxoResult, GetRawTransactionsAsync, LocalValidator } from '../index';

let name = "My NFT1 Child";
let ticker = "NFT1 Child";
let documentUri: string|null = null;
let documentHash: Buffer|null = null;
let NFT1ParentGroupID = "112f967519e18083c8e4bd7ba67ebc04d72aaaa941826d38655c53d677e6a5be";

(async function() {
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

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

    // VALIDATOR: FOR REMOTE VALIDATION
    //const bitboxNetwork = new BitboxNetwork(BITBOX);

    // VALIDATOR: FOR LOCAL VALIDATOR / REMOTE JSON RPC
    const getRawTransactions: GetRawTransactionsAsync = 
    async function(txids: string[]) { 
        return <string[]>await BITBOX.RawTransactions.getRawTransaction(txids) }
    const logger = console;
    const slpValidator = new LocalValidator(BITBOX, getRawTransactions, logger);
    const bitboxNetwork = new BitboxNetwork(BITBOX, slpValidator);

    // Get all balances at the funding address.
    let balances = <SlpBalancesResult>await bitboxNetwork.getAllSlpBalancesAndUtxos(fundingAddress);
    console.log("'balances' variable is set.");
    console.log('BCH balance:', balances.satoshis_available_bch);

    // Look at the NFT1 Parent token balance.  Make sure its greater than 0.
    if(!balances.slpTokenBalances[NFT1ParentGroupID] || !balances.slpTokenBalances[NFT1ParentGroupID].isGreaterThan(0)) {
        throw Error("Insufficient balance of NFT1 tokens, first you need to create NFT1 parent at this address.");
    }

    // Try to find an NFT parent that has quantity equal to 1
    let utxo: SlpAddressUtxoResult|undefined;
    balances.slpTokenUtxos[NFT1ParentGroupID].forEach(txo => {
        if(!utxo && txo.slpUtxoJudgementAmount.isEqualTo(1)) {
            utxo = txo;
        }
    })

    // If there wasn't any NFT1 parent UTXO with quantity of 1, so we create a TXO w/ qty 1 to be burned.
    if(!utxo) {
        let inputs = [...balances.nonSlpUtxos, ...balances.slpTokenUtxos[NFT1ParentGroupID]]
        inputs.map(txo => txo.wif = fundingWif)
        let sendTxid = await bitboxNetwork.simpleTokenSend(NFT1ParentGroupID, new BigNumber(1), inputs, tokenReceiverAddress, tokenReceiverAddress);
        
        // wait for transaction to hit the full node.
        await sleep(3000);
        
        // update balances and set the newly created parent TXO.
        balances = <SlpBalancesResult>await bitboxNetwork.getAllSlpBalancesAndUtxos(fundingAddress);
        balances.slpTokenUtxos[NFT1ParentGroupID].forEach(txo => {
            if(!utxo && txo.slpUtxoJudgementAmount.isEqualTo(1)) {
                utxo = txo;
            }
        });
    }

    // 3) Set private keys
    let inputs = [utxo!, ...balances.nonSlpUtxos];
    inputs.map(txo => txo.wif = fundingWif);

    // 4) Use "simpleTokenGenesis()" helper method
    let genesisTxid = await bitboxNetwork.simpleNFT1ChildGenesis(
            NFT1ParentGroupID,
            name, 
            ticker, 
            documentUri,
            documentHash,
            tokenReceiverAddress,
            bchChangeReceiverAddress,
            inputs
            );
    console.log("NFT1 Child GENESIS txn complete:", genesisTxid);
})()
