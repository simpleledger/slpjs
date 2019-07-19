/***************************************************************************************
 * 
 *  Example 6: Minting for a Type 1 or NFT1 Parent token
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
import { BitboxNetwork, SlpBalancesResult, GetRawTransactionsAsync, LocalValidator } from '../index';
import { GetRawTransactionRequest, GrpcClient } from 'grpc-bchrpc-node';

(async function() {

    // FOR MAINNET UNCOMMENT
    const BITBOX = new BITBOXSDK.BITBOX({ restURL: 'https://rest.bitcoin.com/v2/' });
    const fundingAddress           = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu";  // <-- must be simpleledger format
    const fundingWif               = "L3gngkDg1HW5P9v5GdWWiCi3DWwvw5XnzjSPwNwVPN5DSck3AaiF";     // <-- compressed WIF format
    const tokenReceiverAddress     = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu";  // <-- must be simpleledger format
    const batonReceiverAddress     = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu";
    const bchChangeReceiverAddress = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu";  // <-- cashAddr or slpAddr format
    const tokenIdHexToMint = "112f967519e18083c8e4bd7ba67ebc04d72aaaa941826d38655c53d677e6a5be";
    let additionalTokenQty = 1000

    // FOR TESTNET UNCOMMENT
    // const BITBOX = new BITBOXSDK.BITBOX({ restURL: 'https://trest.bitcoin.com/v2/' });
    // const fundingAddress           = "slptest:qpwyc9jnwckntlpuslg7ncmhe2n423304ueqcyw80l";
    // const fundingWif               = "cVjzvdHGfQDtBEq7oddDRcpzpYuvNtPbWdi8tKQLcZae65G4zGgy";
    // const tokenReceiverAddress     = "slptest:qpwyc9jnwckntlpuslg7ncmhe2n423304ueqcyw80l";
    // const batonReceiverAddress     = "slptest:qpwyc9jnwckntlpuslg7ncmhe2n423304ueqcyw80l";
    // const bchChangeReceiverAddress = "slptest:qpwyc9jnwckntlpuslg7ncmhe2n423304ueqcyw80l";
    // const tokenIdHexToMint = "a67e2abb2fcfaa605c6a3b0dfb642cc830b63138d85b5e95eee523fdbded4d74";
    // let additionalTokenQty = 1000

    // VALIDATOR: FOR REMOTE VALIDATION
    //const bitboxNetwork = new BitboxNetwork(BITBOX);

    // VALIDATOR: FOR LOCAL VALIDATOR / REMOTE JSON RPC
    let grpc = new GrpcClient();
    const getRawTransactions: GetRawTransactionsAsync = async function(txids: string[]) { 
        let txid = txids[0];
        let res = await grpc.getRawTransaction({ hash: txid, reverseOrder: true });
        return [Buffer.from(res.getTransaction_asU8()).toString('hex')];
        //return <string[]>await BITBOX.RawTransactions.getRawTransaction(txids)  // <--- alternative to gRPC
    }
    const logger = console;
    const slpValidator = new LocalValidator(BITBOX, getRawTransactions, logger);
    const bitboxNetwork = new BitboxNetwork(BITBOX, slpValidator);

    // 1) Get all balances at the funding address.
    let balances = <SlpBalancesResult>await bitboxNetwork.getAllSlpBalancesAndUtxos(fundingAddress);
    console.log("'balances' variable is set.");
    if(balances.slpBatonUtxos[tokenIdHexToMint])
        console.log("You have the minting baton for this token");
    else
        throw Error("You don't have the minting baton for this token");

    // 2) Fetch critical token decimals information using bitdb
    const tokenInfo = await bitboxNetwork.getTokenInformation(tokenIdHexToMint);
    let tokenDecimals = tokenInfo.decimals; 
    console.log("Token precision: " + tokenDecimals.toString());

    // 3) Multiply the specified token quantity by 10^(token decimal precision)
    let mintQty = (new BigNumber(additionalTokenQty)).times(10**tokenDecimals)

    // 4) Filter the list to choose ONLY the baton of interest 
    // NOTE: (spending other batons for other tokens will result in losing ability to mint those tokens)
    let inputUtxos = balances.slpBatonUtxos[tokenIdHexToMint]

    // 5) Simply sweep our BCH (non-SLP) utxos to fuel the transaction
    inputUtxos = inputUtxos.concat(balances.nonSlpUtxos);

    // 6) Set the proper private key for each Utxo
    inputUtxos.forEach(txo => txo.wif = fundingWif)

    // 7) MINT token using simple function
    let mintTxid = await bitboxNetwork.simpleTokenMint(
            tokenIdHexToMint, 
            mintQty, 
            inputUtxos, 
            tokenReceiverAddress, 
            batonReceiverAddress, 
            bchChangeReceiverAddress
            )
    console.log("MINT txn complete:",mintTxid);

})();
