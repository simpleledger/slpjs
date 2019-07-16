# SLPJS

SLPJS is a JavaScript Library for validating and building [Simple Ledger Protocol (SLP)](https://github.com/simpleledger/slp-specification/blob/master/slp-token-type-1.md) token transactions.   GENESIS, MINT, and SEND token functions are supported.  See [change log](#change-log) for updates.

[![NPM](https://nodei.co/npm/slpjs.png)](https://nodei.co/npm/slpjs/)



Table of Contents
=================

   * [Installation](#installation)
   * [Transaction Examples](#transaction-examples)
      * [Get Balances](#get-balances)
      * [GENESIS - Create a new token (fungible)](#genesis---create-a-new-token-fungible)
      * [GENESIS - Create a new token (non-fungible)](#genesis---create-a-new-token-non-fungible)
      * [MINT - Create additional tokens](#mint---create-additional-tokens)
      * [SEND - Send tokens](#send---send-tokens)
      * [SEND - Send tokens from a frozen address](#send---send-tokens-from-a-frozen-address)
      * [SEND - Send tokens from 2-of-2 multisig (P2SH)](#send---send-tokens-from-2-of-2-multisig-p2sh)
      * [BURN - Destroy tokens for a certain Token Id](#burn---destroy-tokens-for-a-certain-token-id)
      * [Address Conversion](#address-conversion)
   * [Validation Examples](#validation-examples)
      * [Validation Example 1: Local Validator &amp; Remote Full Node RPC](#validation-example-1-local-validator--remote-full-node-rpc)
      * [Validation Example 2: Local Validator &amp; Local Full Node RPC](#validation-example-2-local-validator--local-full-node-rpc)
      * [Validation Example 3: Remote Validator (rest.bitcoin.com/v2/slp/validateTxid POST)](#validation-example-3-remote-validator-restbitcoincomv2slpvalidatetxid-post)
   * [Building &amp; Testing](#building--testing)
      * [Requirements](#requirements)
      * [Build](#build)
      * [Test](#test)
   * [Change Log](#change-log)



# Installation

#### For node.js
`npm install slpjs`

#### For browser
```<script src='https://unpkg.com/slpjs'></script>```



# Transaction Examples

The following examples show how this library can be used to make simple token transactions.

Wallets utilizing this library will want to write their own methods in place of the methods found in `TransactionHelpers` and `BitboxNetwork` classes.

NOTES: 

* The [BigNumber.js library](https://github.com/MikeMcl/bignumber.js) is used to avoid precision issues with numbers having more than 15 significant digits.
* For the fastest validation performance all of the following transaction examples show how to use SLPJS using default SLP validation via `rest.bitcoin.com`.  See the [Local Validation](#local-validation) section for instructions on how to validate SLP locally with your own full node.
* All SLPJS methods require token quantities to be expressed in the smallest possible unit of account for the token (i.e., token satoshis).  This requires the token's precision to be used to calculate the quantity. For example, token having a decimal precision of 9 sending an amount of 1.01 tokens would need to first calculate the sending amount using `1.01 x 10^9 => 1010000000`.

## Get Balances

```js
// Install BITBOX-SDK v8.1+ for blockchain access
// For more information visit: https://www.npmjs.com/package/bitbox-sdk
const BITBOXSDK = require('bitbox-sdk')
const slpjs = require('slpjs');

// FOR MAINNET UNCOMMENT
let addr = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu";
const BITBOX = new BITBOXSDK.BITBOX({ restURL: 'https://rest.bitcoin.com/v2/' });

// FOR TESTNET UNCOMMENT
// let addr = "slptest:qpwyc9jnwckntlpuslg7ncmhe2n423304ueqcyw80l";
// const BITBOX = new BITBOXSDK.BITBOX({ restURL: 'https://trest.bitcoin.com/v2/' });

const bitboxNetwork = new slpjs.BitboxNetwork(BITBOX);

let balances;
(async function() {
  balances = await bitboxNetwork.getAllSlpBalancesAndUtxos(addr);
  console.log("balances: ", balances);
})();

// RETURNS ALL BALANCES & UTXOs: 

// { satoshis_available_bch: 190889,
//   satoshis_locked_in_slp_baton: 546,
//   satoshis_locked_in_slp_token: 1092,
//   satoshis_in_invalid_token_dag: 0,
//   satoshis_in_invalid_baton_dag: 0,
//   slpTokenBalances: {
//      '1cda254d0a995c713b7955298ed246822bee487458cd9747a91d9e81d9d28125': BigNumber { s: 1, e: 3, c: [ 1000 ] },
//      '047918c612e94cce03876f1ad2bd6c9da43b586026811d9b0d02c3c3e910f972': BigNumber { s: 1, e: 2, c: [ 100 ] } 
//   },
//   nftParentChildBalances: {
//      'parentId1': {
//            'childId1': BigNumber
//            'childId2': BigNumber
//      }
//      'parentId2': {
//            'childId1': BigNumber
//            'childId2': BigNumber
//      }
//   }
//   slpTokenUtxos: [ ... ],
//   slpBatonUtxos: [ ... ],
//   invalidTokenUtxos: [ ... ],
//   invalidBatonUtxos: [ ... ],
//   nonSlpUtxos: [ ... ]
//   unknownTokenTypeUtxos: [ ... ]
// }
```



## GENESIS - Create a new token (fungible)

GENESIS is the most simple type of SLP transaction since no special inputs are required.

```js
// Install BITBOX-SDK v8.1+ for blockchain access
// For more information visit: https://www.npmjs.com/package/bitbox-sdk
const BITBOXSDK = require('bitbox-sdk')
const BigNumber = require('bignumber.js');
const slpjs = require('slpjs');

// FOR MAINNET UNCOMMENT
const BITBOX = new BITBOXSDK.BITBOX({ restURL: 'https://rest.bitcoin.com/v2/' });
const fundingAddress           = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu";  // <-- must be simpleledger format
const fundingWif               = "L3gngkDg1HW5P9v5GdWWiCi3DWwvw5XnzjSPwNwVPN5DSck3AaiF";     // <-- compressed WIF format
const tokenReceiverAddress     = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu";  // <-- must be simpleledger format
const bchChangeReceiverAddress = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu";  // <-- cashAddr or slpAddr format
// For unlimited issuance provide a "batonReceiverAddress"
const batonReceiverAddress     = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu";

// FOR TESTNET UNCOMMENT
// const BITBOX = new BITBOXSDK.BITBOX({ restURL: 'https://trest.bitcoin.com/v2/' });
// const fundingAddress           = "slptest:qpwyc9jnwckntlpuslg7ncmhe2n423304ueqcyw80l";
// const fundingWif               = "cVjzvdHGfQDtBEq7oddDRcpzpYuvNtPbWdi8tKQLcZae65G4zGgy";
// const tokenReceiverAddress     = "slptest:qpwyc9jnwckntlpuslg7ncmhe2n423304ueqcyw80l";
// const bchChangeReceiverAddress = "slptest:qpwyc9jnwckntlpuslg7ncmhe2n423304ueqcyw80l";
// // For unlimited issuance provide a "batonReceiverAddress"
// const batonReceiverAddress     = "slptest:qpwyc9jnwckntlpuslg7ncmhe2n423304ueqcyw80l";

const bitboxNetwork = new slpjs.BitboxNetwork(BITBOX);

// 1) Get all balances at the funding address.
let balances; 
(async function() {
  balances = await bitboxNetwork.getAllSlpBalancesAndUtxos(fundingAddress);
  console.log("'balances' variable is set.");
  console.log('BCH balance:', balances.satoshis_available_bch);
})();

// WAIT FOR NETWORK RESPONSE...

// 2) Select decimal precision for this new token
let decimals = 2;
let name = "Awesome SLPJS README Token";
let ticker = "SLPJS";
let documentUri = "info@simpleledger.io";
let documentHash = null
let initialTokenQty = 1000000

// 3) Calculate the token quantity with decimal precision included
initialTokenQty = (new BigNumber(initialTokenQty)).times(10**decimals);

// 4) Set private keys
balances.nonSlpUtxos.forEach(txo => txo.wif = fundingWif)

// 5) Use "simpleTokenGenesis()" helper method
let genesisTxid;
(async function(){
    genesisTxid = await bitboxNetwork.simpleTokenGenesis(
        name, 
        ticker, 
        initialTokenQty,
        documentUri,
        documentHash,
        decimals,
        tokenReceiverAddress,
        batonReceiverAddress,
        bchChangeReceiverAddress,
        balances.nonSlpUtxos
        )
    console.log("GENESIS txn complete:",genesisTxid)
})();

```

## GENESIS - Create a new token ([non-fungible](https://github.com/simpleledger/slp-specifications/blob/master/NFT.md))

Non-fungible tokens can be created with the `simpleNFT1Genesis` method with these parameters:

```js
// Install BITBOX-SDK v8.1+ for blockchain access
// For more information visit: https://www.npmjs.com/package/bitbox-sdk
const BITBOXSDK = require('bitbox-sdk')
const BigNumber = require('bignumber.js');
const slpjs = require('slpjs');

const BITBOX = new BITBOXSDK.BITBOX({ restURL: 'https://rest.bitcoin.com/v2/' });
const fundingAddress           = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu"; // <-- must be simpleledger format
const fundingWif               = "L3gngkDg1HW5P9v5GdWWiCi3DWwvw5XnzjSPwNwVPN5DSck3AaiF";    // <-- compressed WIF format
const tokenReceiverAddress     = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu"; // <-- must be simpleledger format
const bchChangeReceiverAddress = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu"; // <-- cashAddr or slpAddr format

const parentTokenIdHex = "<32-byte token id of parent token>";

const bitboxNetwork = new slpjs.BitboxNetwork(BITBOX);

// 1) Get all balances at the funding address.
let balances;
(async function() {
  balances = await bitboxNetwork.getAllSlpBalancesAndUtxos(fundingAddress);
  console.log("'balances' variable is set.");
  console.log('BCH balance:', balances.satoshis_available_bch);
})();

// WAIT FOR NETWORK RESPONSE...

// 2) Select decimal precision for this new NFT1 token
let name = "I'm a unique token";
let ticker = "NFT1";

// 3) Set private keys for BCH & Tokens
balances.nonSlpUtxos.forEach(txo => txo.wif = fundingWif)
balances.slpTokenUtxos[parentTokenId][0].wif = fundingWif;
let inputs = balances.nonSlpUtxos.concat(balances.slpTokenUtxos[parentTokenId][0])

// 4) Use "simpleTokenGenesis()" helper method
let genesisTxid;
(async function(){
  //tokenName: string, tokenTicker: string, parentTokenIdHex: string, tokenReceiverAddress: string, bchChangeReceiverAddress: string, inputUtxos: SlpAddressUtxoResult[]
    genesisTxid = await bitboxNetwork.simpleNFT1Genesis(
        name, 
        ticker, 
        parentTokenIdHex,
        tokenReceiverAddress,
        bchChangeReceiverAddress,
        inputs
        )
    console.log("NFT1 GENESIS txn complete:",genesisTxid)
})();

```


## MINT - Create additional tokens

Adding additional tokens for a token that already exists is possible if you are in control of the minting "baton".  This minting baton is a special UTXO that gives authority to add to the token's circulating supply.  

```javascript
// Install BITBOX-SDK v8.1+ for blockchain access
// For more information visit: https://www.npmjs.com/package/bitbox-sdk
const BITBOXSDK = require('bitbox-sdk')
const BigNumber = require('bignumber.js');
const slpjs = require('slpjs');

// FOR MAINNET UNCOMMENT
const BITBOX = new BITBOXSDK.BITBOX({ restURL: 'https://rest.bitcoin.com/v2/' });
const fundingAddress           = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu";  // <-- must be simpleledger format
const fundingWif               = "L3gngkDg1HW5P9v5GdWWiCi3DWwvw5XnzjSPwNwVPN5DSck3AaiF";     // <-- compressed WIF format
const tokenReceiverAddress     = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu";  // <-- must be simpleledger format
const batonReceiverAddress     = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu";
const bchChangeReceiverAddress = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu";  // <-- cashAddr or slpAddr format
const tokenIdHexToMint = "adcf120f51d45056bc79353a2831ecd1843922b3d9fac5f109160bd2d49d3f4c";
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

const bitboxNetwork = new slpjs.BitboxNetwork(BITBOX);

// 1) Get all balances at the funding address.
let balances; 
(async function() {
  balances = await bitboxNetwork.getAllSlpBalancesAndUtxos(fundingAddress);
  console.log("'balances' variable is set.");
  if(balances.slpBatonUtxos[tokenIdHexToMint])
    console.log("You have the minting baton for this token");
  else
    throw Error("You don't have the minting baton for this token");
})();

// 2) Fetch critical token decimals information using bitdb
let tokenDecimals;
(async function() {
    const tokenInfo = await bitboxNetwork.getTokenInformation(tokenIdHexToMint);
    tokenDecimals = tokenInfo.decimals; 
    console.log("Token precision: " + tokenDecimals.toString());
})();

// WAIT FOR ASYNC METHOD TO COMPLETE

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
let mintTxid;
(async function() {
    mintTxid = await bitboxNetwork.simpleTokenMint(
        tokenIdHexToMint, 
        mintQty, 
        inputUtxos, 
        tokenReceiverAddress, 
        batonReceiverAddress, 
        bchChangeReceiverAddress
        )
    console.log("MINT txn complete:",mintTxid);
})();

```



## SEND - Send tokens

This example shows the general workflow for sending an existing token.

```js
// Install BITBOX-SDK v8.1+ for blockchain access
// For more information visit: https://www.npmjs.com/package/bitbox-sdk
const BITBOXSDK = require('bitbox-sdk');
const BigNumber = require('bignumber.js');
const slpjs = require('slpjs');

// FOR MAINNET UNCOMMENT
const BITBOX = new BITBOXSDK.BITBOX({ restURL: 'https://rest.bitcoin.com/v2/' });
const fundingAddress           = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu";     // <-- must be simpleledger format
const fundingWif               = "L3gngkDg1HW5P9v5GdWWiCi3DWwvw5XnzjSPwNwVPN5DSck3AaiF";        // <-- compressed WIF format
const tokenReceiverAddress     = [ "simpleledger:qplrqmjgpug2qrfx4epuknvwaf7vxpnuevyswakrq9" ]; // <-- must be simpleledger format
const bchChangeReceiverAddress = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu";     // <-- must be simpleledger format
let tokenId = "d32b4191d3f78909f43a3f5853ba59e9f2d137925f28e7780e717f4b4bfd4a3f";
let sendAmounts = [ 1 ];

// FOR TESTNET UNCOMMENT
// const BITBOX = new BITBOXSDK.BITBOX({ restURL: 'https://trest.bitcoin.com/v2/' });
// const fundingAddress           = "slptest:qpwyc9jnwckntlpuslg7ncmhe2n423304ueqcyw80l";   // <-- must be simpleledger format
// const fundingWif               = "cVjzvdHGfQDtBEq7oddDRcpzpYuvNtPbWdi8tKQLcZae65G4zGgy"; // <-- compressed WIF format
// const tokenReceiverAddress     = "slptest:qpwyc9jnwckntlpuslg7ncmhe2n423304ueqcyw80l";   // <-- must be simpleledger format
// const bchChangeReceiverAddress = "slptest:qpwyc9jnwckntlpuslg7ncmhe2n423304ueqcyw80l";   // <-- must be simpleledger format
// let tokenId = "78d57a82a0dd9930cc17843d9d06677f267777dd6b25055bad0ae43f1b884091";
// let sendAmounts = [ 10 ];

const bitboxNetwork = new slpjs.BitboxNetwork(BITBOX);

// 1) Fetch critical token information
let tokenDecimals;
(async function() {
    const tokenInfo = await bitboxNetwork.getTokenInformation(tokenId);
    tokenDecimals = tokenInfo.decimals; 
    console.log("Token precision: " + tokenDecimals.toString());
})();

// Wait for network responses...

// 2) Check that token balance is greater than our desired sendAmount
let balances; 
(async function() {
  balances = await bitboxNetwork.getAllSlpBalancesAndUtxos(fundingAddress);
  console.log("'balances' variable is set.");
  console.log(balances);
  if(balances.slpTokenBalances[tokenId] === undefined)
    console.log("You need to fund the addresses provided in this example with tokens and BCH.  Change the tokenId as required.")
  console.log("Token balance:", balances.slpTokenBalances[tokenId].toFixed() / 10**tokenDecimals);
})();

// Wait for network responses...

// 3) Calculate send amount in "Token Satoshis".  In this example we want to just send 1 token unit to someone...
sendAmounts = sendAmounts.map(a => (new BigNumber(a)).times(10**tokenDecimals));  // Don't forget to account for token precision

// 4) Get all of our token's UTXOs
let inputUtxos = balances.slpTokenUtxos[tokenId];

// 5) Simply sweep our BCH utxos to fuel the transaction
inputUtxos = inputUtxos.concat(balances.nonSlpUtxos);

// 6) Set the proper private key for each Utxo
inputUtxos.forEach(txo => txo.wif = fundingWif);

// 7) Send token
let sendTxid;
(async function(){
    sendTxid = await bitboxNetwork.simpleTokenSend(
        tokenId, 
        sendAmounts, 
        inputUtxos, 
        tokenReceiverAddress, 
        bchChangeReceiverAddress
        )
    console.log("SEND txn complete:", sendTxid);
})();
```

## SEND - Send tokens from a frozen address

This example shows how to freeze funds until a future time using OP_CLTV.  First, the address is calculated based on a user-defined public key and locktime. After the locktime has elapsed the user can proceed to spend those funds as demonstrated in this example:

redeemScript (locking script) = `<locktime> OP_CHECKLOCKTIMEVERIFY OP_DROP <pubkey> OP_CHECKSIG`

unlocking script = `<signature>`

```js
const BITBOXSDK = require('bitbox-sdk');
const BigNumber = require('bignumber.js');
const slpjs = require('slpjs');
const BITBOX = new BITBOXSDK.BITBOX({ restURL: 'https://trest.bitcoin.com/v2/' });
const slp = new slpjs.Slp(BITBOX);
const helpers = new slpjs.TransactionHelpers(slp);
const opcodes = BITBOX.Script.opcodes;

const pubkey = "0286d74c6fb92cb7b70b817094f48bf8fd398e64663bc3ddd7acc0a709212b9f69";
const wif = "cPamRLmPyuuwgRAbB6JHhXvrGwvHtmw9LpVi8QnUZYBubCeyjgs1";
const tokenReceiverAddress     = [ "slptest:prk685k6r508xkj7u9g8v9p3f97hrmgr2qp7r4safs" ]; // <-- must be simpleledger format
const bchChangeReceiverAddress = "slptest:prk685k6r508xkj7u9g8v9p3f97hrmgr2qp7r4safs";     // <-- must be simpleledger format
let tokenId = "f0c7a8a7addc29edbc193212057d91c3eb004678e15e4662773146bdd51f8d7a";
let sendAmounts = [ 1 ];

// Set our BIP-113 time lock (subtract an hour to acount for MTP-11)
const time_delay_seconds = 0;  // let's just set it to 0 so we can redeem it immediately.
let locktime, locktimeBip62;
(async function(){
  locktime = (await BITBOX.Blockchain.getBlockchainInfo()).mediantime + time_delay_seconds - 3600;

  // NOTE: the following locktime is hard-coded so that we can reuse the same P2SH address.
  locktimeBip62 = 'c808f05c' //slpjs.Utils.get_BIP62_locktime_hex(locktime);  
})();

// Wait for network response...

let redeemScript = BITBOX.Script.encode([
  Buffer.from(locktimeBip62, 'hex'),
  opcodes.OP_CHECKLOCKTIMEVERIFY,
  opcodes.OP_DROP,
  Buffer.from(pubkey, 'hex'),
  opcodes.OP_CHECKSIG
])

// Calculate the address for this script contract 
// We need to send some token and BCH to it before we can spend it!
let fundingAddress = slpjs.Utils.slpAddressFromHash160(
                              BITBOX.Crypto.hash160(redeemScript), 
                              'testnet', 
                              'p2sh'
                            );

// gives us: slptest:prk685k6r508xkj7u9g8v9p3f97hrmgr2qp7r4safs

const bitboxNetwork = new slpjs.BitboxNetwork(BITBOX);

// Fetch critical token information
let tokenDecimals;
(async function() {
    const tokenInfo = await bitboxNetwork.getTokenInformation(tokenId);
    tokenDecimals = tokenInfo.decimals; 
    console.log("Token precision: " + tokenDecimals.toString());
})();

// Wait for network response...

// Check that token balance is greater than our desired sendAmount
let balances; 
(async function() {
  balances = await bitboxNetwork.getAllSlpBalancesAndUtxos(fundingAddress);
  console.log("'balances' variable is set.");
  console.log(balances);
  if(balances.slpTokenBalances[tokenId] === undefined)
    console.log("You need to fund the addresses provided in this example with tokens and BCH.  Change the tokenId as required.")
  console.log("Token balance:", balances.slpTokenBalances[tokenId].toFixed() / 10**tokenDecimals);
})();

// Wait for network response...

// Calculate send amount in "Token Satoshis".  In this example we want to just send 1 token unit to someone...
sendAmounts = sendAmounts.map(a => (new BigNumber(a)).times(10**tokenDecimals));  // Don't forget to account for token precision

// Get all of our token's UTXOs
let inputUtxos = balances.slpTokenUtxos[tokenId];

// Simply sweep our BCH utxos to fuel the transaction
inputUtxos = inputUtxos.concat(balances.nonSlpUtxos);

// Estimate the additional fee for our larger p2sh scriptSigs
let extraFee = (8) *  // for OP_CTLV and timelock data push
                inputUtxos.length  // this many times since we swept inputs from p2sh address

// Build an unsigned transaction
let unsignedTxnHex = helpers.simpleTokenSend(tokenId, sendAmounts, inputUtxos, tokenReceiverAddress, bchChangeReceiverAddress, [], extraFee);
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
let sendTxid;
(async function(){
    sendTxid = await bitboxNetwork.sendTx(signedTxn)
    console.log("SEND txn complete:", sendTxid);
})();

```

## SEND - Send tokens from 2-of-2 multisig (P2SH)

This example shows the general workflow for sending tokens from a P2SH multisig address.  Electron Cash SLP edition [3.4.13](https://simpleledger.cash/project/electron-cash-slp-edition/) is compatible with signing the partially signed transactions generated from this example by using the `insert_input_values_for_EC_signers` helper method.

```js
// Install BITBOX-SDK v8.1+ for blockchain access
// For more information visit: https://www.npmjs.com/package/bitbox-sdk
const BITBOXSDK = require('bitbox-sdk');
const BigNumber = require('bignumber.js');
const slpjs = require('slpjs');
const BITBOX = new BITBOXSDK.BITBOX({ restURL: 'https://rest.bitcoin.com/v2/' });
const slp = new slpjs.Slp(BITBOX);
const helpers = new slpjs.TransactionHelpers(slp);

const pubkey_signer_1 = "02471e07bcf7d47afd40e0bf4f806347f9e8af4dfbbb3c45691bbaefd4ea926307"; // Signer #1
const pubkey_signer_2 = "03472cfca5da3bf06a85c5fd860ffe911ef374cf2a9b754fd861d1ead668b15a32"; // Signer #2

// we have two signers for this 2-of-2 multisig address (so for the missing key we just put "null")
const wifs = [ null, "L2AdfmxwsYu3KnRASZ51C3UEnduUDy1b21sSF9JbLNVEPzsxEZib"] //[ "Ky6iiLSL2K9stMd4G5dLeXfpVKu5YRB6dhjCsHyof3eaB2cDngSr", null ];

// to keep this example alive we will just send everything to the same address
const tokenReceiverAddress     = [ "simpleledger:pphnuh7dx24rcwjkj0sl6xqfyfzf23aj7udr0837gn" ]; // <-- must be simpleledger format
const bchChangeReceiverAddress = "simpleledger:pphnuh7dx24rcwjkj0sl6xqfyfzf23aj7udr0837gn";     // <-- must be simpleledger format
let tokenId = "497291b8a1dfe69c8daea50677a3d31a5ef0e9484d8bebb610dac64bbc202fb7";
let sendAmounts = [ 1 ];

const bitboxNetwork = new slpjs.BitboxNetwork(BITBOX);

// 1) Fetch critical token information
let tokenDecimals;
(async function() {
    const tokenInfo = await bitboxNetwork.getTokenInformation(tokenId);
    tokenDecimals = tokenInfo.decimals; 
    console.log("Token precision: " + tokenDecimals.toString());
})();

// Wait for network responses...

// 2) Check that token balance is greater than our desired sendAmount
let fundingAddress = "simpleledger:pphnuh7dx24rcwjkj0sl6xqfyfzf23aj7udr0837gn";
let balances; 
(async function() {
  balances = await bitboxNetwork.getAllSlpBalancesAndUtxos(fundingAddress);
  console.log("'balances' variable is set.");
  console.log(balances);
  if(balances.slpTokenBalances[tokenId] === undefined)
    console.log("You need to fund the addresses provided in this example with tokens and BCH.  Change the tokenId as required.")
  console.log("Token balance:", balances.slpTokenBalances[tokenId].toFixed() / 10**tokenDecimals);
})();

// Wait for network responses...

// 3) Calculate send amount in "Token Satoshis".  In this example we want to just send 1 token unit to someone...
sendAmounts = sendAmounts.map(a => (new BigNumber(a)).times(10**tokenDecimals));  // Don't forget to account for token precision

// 4) Get all of our token's UTXOs
let inputUtxos = balances.slpTokenUtxos[tokenId];

// 5) Simply sweep our BCH utxos to fuel the transaction
inputUtxos = inputUtxos.concat(balances.nonSlpUtxos);

// 6) Estimate the additional fee for our larger p2sh scriptSigs
let extraFee = (2 * 33 +  // two pub keys in each redeemScript
                2 * 72 +  // two signatures in scriptSig
                10) *     // for OP_CMS and various length bytes
                inputUtxos.length  // this many times since we swept inputs from p2sh address

// 7) Build an unsigned transaction
let unsignedTxnHex = helpers.simpleTokenSend(tokenId, sendAmounts, inputUtxos, tokenReceiverAddress, bchChangeReceiverAddress, [], extraFee);

// 8) Build scriptSigs for all intputs
let redeemData = helpers.build_P2SH_multisig_redeem_data(2, [pubkey_signer_1, pubkey_signer_2]);
let scriptSigs = inputUtxos.map((txo, i) => {
    let sigData = redeemData.pubKeys.map((pk, j) => {
      if(wifs[j]) {
        return helpers.get_transaction_sig_p2sh(unsignedTxnHex, wifs[j], i, txo.satoshis, redeemData.lockingScript)
      }
      else {
        return helpers.get_transaction_sig_filler(i, pk)
      }
    })
    return helpers.build_P2SH_multisig_scriptSig(redeemData, i, sigData)
})

// 9) apply our scriptSigs to the unsigned transaction
let signedTxn = helpers.addScriptSigs(unsignedTxnHex, scriptSigs);

// 10) Update transaction hex with input values to allow for our second signer who is using Electron Cash SLP edition (https://simpleledger.cash/project/electron-cash-slp-edition/)
let input_values = inputUtxos.map(txo => txo.satoshis)
signedTxn = helpers.insert_input_values_for_EC_signers(signedTxn, input_values)

// 11) Send token
let sendTxid;
(async function(){
    sendTxid = await bitboxNetwork.sendTx(signedTxn)
    console.log("SEND txn complete:", sendTxid);
})();
```

## BURN - Destroy tokens for a certain Token Id

This example shows the general workflow for sending an existing token.

```javascript

// Install BITBOX-SDK v8.1+ for blockchain access
// For more information visit: https://www.npmjs.com/package/bitbox-sdk
const BITBOXSDK = require('bitbox-sdk')
const BigNumber = require('bignumber.js');
const slpjs = require('slpjs');

const BITBOX = new BITBOXSDK.BITBOX({ restURL: 'https://rest.bitcoin.com/v2/' });
const fundingAddress           = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu"; // <-- must be simpleledger format
const fundingWif               = "L3gngkDg1HW5P9v5GdWWiCi3DWwvw5XnzjSPwNwVPN5DSck3AaiF";    // <-- compressed WIF format
const bchChangeReceiverAddress = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu"; // <-- must be simpleledger format
let tokenId = "495322b37d6b2eae81f045eda612b95870a0c2b6069c58f70cf8ef4e6a9fd43a";
let burnAmount = 102;

const bitboxNetwork = new slpjs.BitboxNetwork(BITBOX);

// 1) Fetch critical token information
let tokenDecimals;
(async function() {
    const tokenInfo = await bitboxNetwork.getTokenInformation(tokenId);
    tokenDecimals = tokenInfo.decimals; 
    console.log('Token precision:', tokenDecimals.toString());
})();

// 2) Check that token balance is greater than our desired sendAmount
let balances; 
(async function() {
  balances = await bitboxNetwork.getAllSlpBalancesAndUtxos(fundingAddress);
  console.log("'balances' variable is set.");
  console.log('Token balance:', balances.slpTokenBalances[tokenId].toFixed() / 10**tokenDecimals)
})();

// Wait for network responses...

// 3) Calculate send amount in "Token Satoshis".  In this example we want to just send 1 token unit to someone...
let amount = (new BigNumber(burnAmount)).times(10**tokenDecimals);  // Don't forget to account for token precision

// 4) Get all of our token's UTXOs
let inputUtxos = balances.slpTokenUtxos[tokenId];

// 5) Simply sweep our BCH utxos to fuel the transaction
inputUtxos = inputUtxos.concat(balances.nonSlpUtxos);

// 6) Set the proper private key for each Utxo
inputUtxos.forEach(txo => txo.wif = fundingWif)

// 7) Send token
let sendTxid;
(async function(){
    sendTxid = await bitboxNetwork.simpleTokenBurn(
        tokenId, 
        amount, 
        inputUtxos, 
        bchChangeReceiverAddress
        )
    console.log("BURN txn complete:",sendTxid);
})();
```


## Address Conversion

```javascript
let Utils = require('slpjs').Utils;

let slpAddr = Utils.toSlpAddress("bitcoincash:qzat5lfxt86mtph2fdmp96stxdmmw8hchyxrcmuhqf");
console.log(slpAddr);
// simpleledger:qzat5lfxt86mtph2fdmp96stxdmmw8hchy2cnqfh7h

let cashAddr = Utils.toCashAddress(slpAddr);
console.log(cashAddr);
// bitcoincash:qzat5lfxt86mtph2fdmp96stxdmmw8hchyxrcmuhqf
```



# Validation Examples

The following examples show three different ways how you can use this library to validate SLP transactions.  The validation techniques include:

* Local Validator with a JSON RPC full node connection
* Local Validation with a remote full node (using `rest.bitcoin.com`)
* Remote Validation (using `rest.bitcoin.com`)



## Local Validator with a JSON RPC full node connection

Validate SLP transaction locally with a local full node.


```js
const BITBOXSDK = require('bitbox-sdk')
const BITBOX = new BITBOXSDK.BITBOX();
const slpjs = require('slpjs');
const logger = console;
const RpcClient = require('bitcoin-rpc-promise');
const connectionString = 'http://bitcoin:password@localhost:8332'
const rpc = new RpcClient(connectionString);
const slpValidator = new slpjs.LocalValidator(BITBOX, async (txids) => [ await rpc.getRawTransaction(txids[0]) ], logger)

// Result = false
//let txid = "903432f451049357d51c19eb529478621272e7572b05179f89bcb7be31e55aa7";

// Result = true
let txid = "4a3829d6da924a16bbc0cc43d5d62b40996648a0c8f74725c15ec56ee930d0fa";

let isValid;
(async function() {
  console.log("Validating:", txid);
  console.log("This may take a several seconds...");
  isValid = await slpValidator.isValidSlpTxid(txid);
  console.log("Final Result:", isValid);
})();
```



## Local Validation with a remote full node (using `rest.bitcoin.com`)

Validate SLP transaction locally with a remote full node (i.e., rest.bitcoin.com).

```js
const BITBOXSDK = require('bitbox-sdk')
const BITBOX = new BITBOXSDK.BITBOX({ restURL: 'https://rest.bitcoin.com/v2/' });
const slpjs = require('slpjs');
const logger = console;

const getRawTransactions = async function(txids) { return await BITBOX.RawTransactions.getRawTransaction(txids) }
const slpValidator = new slpjs.LocalValidator(BITBOX, getRawTransactions, logger);

// Result = false
//let txid = "903432f451049357d51c19eb529478621272e7572b05179f89bcb7be31e55aa7";

// Result = true
let txid = "4a3829d6da924a16bbc0cc43d5d62b40996648a0c8f74725c15ec56ee930d0fa";

let isValid;
(async function() {
  console.log("Validating:", txid);
  console.log("This may take a several seconds...");
  isValid = await slpValidator.isValidSlpTxid(txid);
  console.log("Final Result:", isValid);
})();

```



## Remote Validation (using `rest.bitcoin.com`)

Validate SLP transaction using rest.bitcoin.com. 

```js
const BITBOXSDK = require('bitbox-sdk')
const BITBOX = new BITBOXSDK.BITBOX({ restURL: 'https://rest.bitcoin.com/v2/' });
const slpjs = require('slpjs');
const logger = console;

const slpValidator = new slpjs.BitboxNetwork(BITBOX, undefined, logger);

// Result = false
//let txid = "903432f451049357d51c19eb529478621272e7572b05179f89bcb7be31e55aa7";

// Result = true
let txid = "ab1550876e217d68bfac55e50b4a82535bb20842f976bdfbc07cca19e8028f13";

let isValid;
(async function() {
  console.log("Validating:", txid);
  console.log("This may take a several seconds...");
  isValid = await slpValidator.isValidSlpTxid(txid);
  console.log("Final Result:", isValid);
})();

```



# Building & Testing

Building this project creates lib/*.js files and then creates browserified versions in the dist folder.

## Requirements
Running the unit tests require node.js v8.15+. 

## Build
`npm run build`

## Test
`npm run test`



# Change Log

### 0.20.5 
- Fix accounting for unknown token type UTXOs in `SlpBalancesResult` by adding `satoshis_in_unknown_token_type` and `unknownTokenTypeUtxos` objects.

### 0.20.4
- Now NFT Parents/Children are readily visible when using `getAllSlpBalancesAndUtxos(<address>)`
  - Add `nftParentChildBalances` dict/map to `SlpBalancesResult`.
  - Add `nftParentId` property to each SLP UTXO object (in type `SlpAddressUtxoResult`).
- Created an examples directory, starting to mirror/migrate README examples to this folder. This will allow easier execution of the examples when they are in TypeScript

### 0.20.3
- Bump version for npm issue with previous version

### 0.20.2
- Export Primatives namespace
- Add 'Primatives.parseFromBuffer()' method
- Remove unused typing from vendors.d.ts
- Update dependency versions to address security flags

### 0.20.1
- Minor typings update

### 0.20.0
- Added full NFT1 validation support with updates to both the validator and parser.
- Critical Issue Fixed: This version fixed a critical bug associated with unsupported token types.  All previous versions will allow unsupported token types to be burned because they are treated as if they are non-SLP UTXOs.  This version includes a new type of UTXO judgement for unsupported token types (`UNSUPPORTED_TYPE`), and they any UTXO receiving this judgement is prevented from being spent in the built-in transaction methods. 
- Added more descriptive code commenting to localvalidator.ts.

### 0.19.0
- Breaking Change: Added initial NFT1 validation support (not yet activated in parser).  Change is breaking due to new `tokenTypeFilter` parameter in method `isValidSlpTxid()`

### 0.18.4
- Tweaked type for ScriptSigP2SH.unlockingScriptBufArray

### 0.18.3
- Added simpleTokenGenesis to bitbox network class

### 0.18.2 
- Added example for freezing tokens
- Added Locktime and CLTV helper methods to TransactionHelpers
- Added get_BIP62_locktime_hex method to Utils
- Breaking Change: Updated Slp.buildSendOpReturn, Slp.buildMintOpReturn, and Slp.buildGenesisOpReturn methods to static

### 0.18.1
- Added generic support for P2SH 
- Added specific helper methods for multisig compatible with Electron Cash signing
- Added README example for multisig w/ Electron Cash SLP co-signer

### 0.18.0
- Added `simpleledger:` URI scheme parser & builder to Utils class per [spec](https://github.com/simpleledger/slp-specifications/blob/master/slp-uri-scheme.md) 
- Removed unused remote proxy validator code
- Bumped Bitbox dep to v8.1 with TypeScript updates

### 0.17.0
- Breaking changes:
  - Dev dependency BITBOX updated to latestest version 8.0.1 from 3.0.11
  - Throws on network error instead of returning null/false
- Non-breaking changes:
  - Added tests for BitboxNetwork class
  - added "decimalConversion" parameter to getTransactionDetails() and getTokenInformation() methods in BitboxNetwork, default is false

### 0.16.3
- Added slp address to getTransactionDetails() response

### 0.16.2
- Added optional logger to LocalValidator & BitboxNetwork classes
- Fixed bug in default remote validation for BitboxNetwork.isValidSlpTxid()
- Added comments warning users about two rate limited methods

### 0.16.1
- Improved error messages for insufficient inputs and fee too low

### 0.16.0 
- Breaking changes: 
  - For all types of SEND transactions the change address must be provided, and the change address must be in simpleledger address format since it may contain token change.
- Non-breaking changes:
  - Added new `vout` property to validation parents in `LocalValidator` class
  - Added change log to `readme.md`
  - Refactored transaction builder methods into a new class called `TransactionHelpers`

### 0.15.13
- Fixed issue in `isSlpAddress` where it would throw instead of return false on some inputs.
- Added `isLegacyAddress`, `toLegacy`, and `slpAddressFromHash160` methods to `Utils` class.

### 0.15.12
- Add transaction helper methods for [NFT1](https://github.com/simpleledger/slp-specifications/blob/master/NFT.md#extension-groupable-supply-limitable-nft-tokens-as-a-derivative-of-fungible-tokens)

### 0.15.11
- validate chunks of 20 with bitcoin.com validator endpoint

### 0.15.10
- handle array object type response from `sendRawTransaction` method in `BitboxNetwork` class

### 0,15.9
- Add default remote validation for BitboxNetwork
- Simplified all README examples to use default validator
- Add description for how to override the default validator
