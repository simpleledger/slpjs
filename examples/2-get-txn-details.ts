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

import * as BITBOXSDK from 'bitbox-sdk';
import { BitboxNetwork, LocalValidator } from '../index';
import { GetRawTransactionsAsync } from '../lib/localvalidator';

(async function() {   
     
    // NETWORK: FOR TESTNET COMMENT/UNCOMMENT
    let txid = "0c681b2df346ffde3d856de12216a974a123ff593c410244b650b67a7ea606c4";
    const BITBOX = new BITBOXSDK.BITBOX({ restURL: 'https://trest.bitcoin.com/v2/' });

    // NETWORK: FOR MAINNET COMMENT/UNCOMMENT
    // let txid = "";
    // const BITBOX = new BITBOXSDK.BITBOX({ restURL: 'https://rest.bitcoin.com/v2/' });

    // VALIDATOR: FOR REMOTE VALIDATION
    // const bitboxNetwork = new BitboxNetwork(BITBOX);

    // VALIDATOR: FOR LOCAL VALIDATOR / REMOTE JSON RPC
    const getRawTransactions: GetRawTransactionsAsync = 
    async function(txids: string[]) { 
        return <string[]>await BITBOX.RawTransactions.getRawTransaction(txids) }
    const logger = console;
    const slpValidator = new LocalValidator(BITBOX, getRawTransactions, logger);
    const bitboxNetwork = new BitboxNetwork(BITBOX, slpValidator);

    let details = await bitboxNetwork.getTransactionDetails(txid, true);
    console.log("Transaction details: ", details);
})();
