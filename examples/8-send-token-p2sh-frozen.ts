/***************************************************************************************
 * 
 *  Example 8: Send any type of token using P2SH frozen address
 * 
 *      redeemScript (locking script):
 *              `<locktime> OP_CHECKLOCKTIMEVERIFY OP_DROP <pubkey> OP_CHECKSIG`
 *      unlocking script:
 *              `<signature>`
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
import { BitboxNetwork, SlpBalancesResult, Slp, TransactionHelpers, Utils } from '../index';

(async function() {
    
    const BITBOX = new BITBOXSDK.BITBOX({ restURL: 'https://trest.bitcoin.com/v2/' });
    const slp = new Slp(BITBOX);
    const helpers = new TransactionHelpers(slp);
    const opcodes = BITBOX.Script.opcodes;
    
    const pubkey = "0286d74c6fb92cb7b70b817094f48bf8fd398e64663bc3ddd7acc0a709212b9f69";
    const wif = "cPamRLmPyuuwgRAbB6JHhXvrGwvHtmw9LpVi8QnUZYBubCeyjgs1";
    const tokenReceiverAddress     = [ "slptest:prk685k6r508xkj7u9g8v9p3f97hrmgr2qp7r4safs" ]; // <-- must be simpleledger format
    const bchChangeReceiverAddress = "slptest:prk685k6r508xkj7u9g8v9p3f97hrmgr2qp7r4safs";     // <-- must be simpleledger format
    let tokenId = "f0c7a8a7addc29edbc193212057d91c3eb004678e15e4662773146bdd51f8d7a";
    let sendAmounts = [ 1 ];
    
    // Set our BIP-113 time lock (subtract an hour to acount for MTP-11)
    const time_delay_seconds = 0;  // let's just set it to 0 so we can redeem it immediately.
    let locktime = (await BITBOX.Blockchain.getBlockchainInfo()).mediantime + time_delay_seconds - 3600;
    
    // NOTE: the following locktime is hard-coded so that we can reuse the same P2SH address.
    let locktimeBip62 = 'c808f05c' //slpjs.Utils.get_BIP62_locktime_hex(locktime);  
        
    let redeemScript = BITBOX.Script.encode([
      Buffer.from(locktimeBip62, 'hex'),
      opcodes.OP_CHECKLOCKTIMEVERIFY,
      opcodes.OP_DROP,
      Buffer.from(pubkey, 'hex'),
      opcodes.OP_CHECKSIG
    ])
    
    // Calculate the address for this script contract 
    // We need to send some token and BCH to it before we can spend it!
    let fundingAddress = Utils.slpAddressFromHash160(
                                  BITBOX.Crypto.hash160(redeemScript), 
                                  'testnet', 
                                  'p2sh'
                                );
    
    // gives us: slptest:prk685k6r508xkj7u9g8v9p3f97hrmgr2qp7r4safs
    
    const bitboxNetwork = new BitboxNetwork(BITBOX);
    
    // Fetch critical token information
    const tokenInfo = await bitboxNetwork.getTokenInformation(tokenId);
    let tokenDecimals = tokenInfo.decimals; 
    console.log("Token precision: " + tokenDecimals.toString());
        
    // Check that token balance is greater than our desired sendAmount
    let balances = <SlpBalancesResult>await bitboxNetwork.getAllSlpBalancesAndUtxos(fundingAddress);
    console.log("'balances' variable is set.");
    console.log(balances);
    if(balances.slpTokenBalances[tokenId] === undefined)
    console.log("You need to fund the addresses provided in this example with tokens and BCH.  Change the tokenId as required.")
    console.log("Token balance:", <any>balances.slpTokenBalances[tokenId].toFixed() / 10**tokenDecimals);
        
    // Calculate send amount in "Token Satoshis".  In this example we want to just send 1 token unit to someone...
    let sendAmountsBN = sendAmounts.map(a => (new BigNumber(a)).times(10**tokenDecimals));  // Don't forget to account for token precision
    
    // Get all of our token's UTXOs
    let inputUtxos = balances.slpTokenUtxos[tokenId];
    
    // Simply sweep our BCH utxos to fuel the transaction
    inputUtxos = inputUtxos.concat(balances.nonSlpUtxos);
    
    // Estimate the additional fee for our larger p2sh scriptSigs
    let extraFee = (8) *  // for OP_CTLV and timelock data push
                    inputUtxos.length  // this many times since we swept inputs from p2sh address
    
    // Build an unsigned transaction
    let unsignedTxnHex = helpers.simpleTokenSend(tokenId, sendAmountsBN, inputUtxos, tokenReceiverAddress, bchChangeReceiverAddress, [], extraFee);
    unsignedTxnHex = helpers.enableInputsCLTV(unsignedTxnHex);
    unsignedTxnHex = helpers.setTxnLocktime(unsignedTxnHex, locktime);
    
    // Build scriptSigs 
    let scriptSigs = inputUtxos.map((txo, i) => {
        let sigObj = helpers.get_transaction_sig_p2sh(unsignedTxnHex, wif, i, txo.satoshis, redeemScript)
        return {
          index: i,
          lockingScriptBuf: redeemScript,
          unlockingScriptBufArray: [ sigObj.signatureBuf ]
      } 
    })
    
    let signedTxn = helpers.addScriptSigs(unsignedTxnHex, scriptSigs);
    
    // 11) Send token
    let sendTxid = await bitboxNetwork.sendTx(signedTxn)
    console.log("SEND txn complete:", sendTxid);
})();
