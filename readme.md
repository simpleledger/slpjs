# SLPJS

SLPJS is a JavaScript Library for building [Simple Ledger Protocol (SLP)](https://github.com/simpleledger/slp-specification/blob/master/slp-token-type-1.md) token transactions.  

GENESIS, MINT, and SEND transaction functions are currently supported. 

[![NPM](https://nodei.co/npm/slpjs.png)](https://nodei.co/npm/slpjs/)



# Installation

#### For node.js
`npm install slpjs`

#### For browser
```<script src='https://unpkg.com/slpjs'></script>```



# Example Usage

The following examples show how this library should be used.

NOTE: The [BigNumber.js library](https://github.com/MikeMcl/bignumber.js) is used to avoid precision issues with numbers having more than 15 significant digits.



## Get Balances

```js
// Install BITBOX-SDK v3.0.2+ instance for blockchain access
// For more information visit: https://www.npmjs.com/package/bitbox-sdk
const BITBOXSDK = require('bitbox-sdk/lib/bitbox-sdk').default
const slpjs = require('slpjs').slpjs;

// FOR TESTNET UNCOMMENT
let addr = "slptest:qpwyc9jnwckntlpuslg7ncmhe2n423304ueqcyw80l";
const BITBOX = new BITBOXSDK({ restURL: 'https://trest.bitcoin.com/v2/' });

// FOR MAINNET UNCOMMENT
// let addr = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu";
// const BITBOX = new BITBOXSDK({ restURL: 'https://rest.bitcoin.com/v2/' });

const slpValidator = new slpjs.LocalValidator(BITBOX, BITBOX.RawTransactions.getRawTransaction);
const bitboxNetwork = new slpjs.BitboxNetwork(BITBOX, slpValidator);

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
//   slpTokenUtxos: [ ... ],
//   slpBatonUtxos: [ ... ],
//   invalidTokenUtxos: [ ... ],
//   invalidBatonUtxos: [ ... ],
//   nonSlpUtxos: [ ... ]
// }
```



## GENESIS - Creating a new token

GENESIS is the most simple type of SLP transaction since no special inputs are required.

```js
// Install BITBOX-SDK v3.0.2+ instance for blockchain access
// For more information visit: https://www.npmjs.com/package/bitbox-sdk
const BITBOXSDK = require('bitbox-sdk/lib/bitbox-sdk').default
const BigNumber = require('bignumber.js');
const slpjs = require('slpjs').slpjs;

// FOR TESTNET UNCOMMENT
const BITBOX = new BITBOXSDK({ restURL: 'https://trest.bitcoin.com/v2/' });
const fundingAddress           = "slptest:qpwyc9jnwckntlpuslg7ncmhe2n423304ueqcyw80l";
const fundingWif               = "cVjzvdHGfQDtBEq7oddDRcpzpYuvNtPbWdi8tKQLcZae65G4zGgy";
const tokenReceiverAddress     = "slptest:qpwyc9jnwckntlpuslg7ncmhe2n423304ueqcyw80l";
const batonReceiverAddress     = "slptest:qpwyc9jnwckntlpuslg7ncmhe2n423304ueqcyw80l";
const bchChangeReceiverAddress = "slptest:qpwyc9jnwckntlpuslg7ncmhe2n423304ueqcyw80l";

// FOR MAINNET UNCOMMENT
// const BITBOX = new BITBOXSDK({ restURL: 'https://rest.bitcoin.com/v2/' });
// const fundingAddress           = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu"; // <-- must be simpleledger format
// const fundingWif               = "L3gngkDg1HW5P9v5GdWWiCi3DWwvw5XnzjSPwNwVPN5DSck3AaiF"; // <-- compressed WIF format
// const tokenReceiverAddress     = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu"; // <-- must be simpleledger format
// const batonReceiverAddress     = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu";
// const bchChangeReceiverAddress = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu"; // <-- cashAddr or slpAddr format

const slpValidator = new slpjs.LocalValidator(BITBOX, BITBOX.RawTransactions.getRawTransaction);
const bitboxNetwork = new slpjs.BitboxNetwork(BITBOX, slpValidator);

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



## MINT - Create more tokens

Adding additional tokens for a token that already exists is possible if you are in control of the minting "baton".  This minting baton is a special UTXO that gives authority to add to the token's circulating supply.  

```javascript
// Install BITBOX-SDK v3.0.2+ instance for blockchain access
// For more information visit: https://www.npmjs.com/package/bitbox-sdk
const BITBOXSDK = require('bitbox-sdk/lib/bitbox-sdk').default
const BigNumber = require('bignumber.js');
const slpjs = require('slpjs').slpjs;

// FOR TESTNET UNCOMMENT
const BITBOX = new BITBOXSDK({ restURL: 'https://trest.bitcoin.com/v2/' });
const fundingAddress           = "slptest:qpwyc9jnwckntlpuslg7ncmhe2n423304ueqcyw80l";
const fundingWif               = "cVjzvdHGfQDtBEq7oddDRcpzpYuvNtPbWdi8tKQLcZae65G4zGgy";
const tokenReceiverAddress     = "slptest:qpwyc9jnwckntlpuslg7ncmhe2n423304ueqcyw80l";
const batonReceiverAddress     = "slptest:qpwyc9jnwckntlpuslg7ncmhe2n423304ueqcyw80l";
const bchChangeReceiverAddress = "slptest:qpwyc9jnwckntlpuslg7ncmhe2n423304ueqcyw80l";
const tokenIdHexToMint = "a67e2abb2fcfaa605c6a3b0dfb642cc830b63138d85b5e95eee523fdbded4d74";
let additionalTokenQty = 1000

// FOR MAINNET UNCOMMENT
// const BITBOX = new BITBOXSDK({ restURL: 'https://rest.bitcoin.com/v2/' });
// const fundingAddress           = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu"; // <-- must be simpleledger format
// const fundingWif               = "L3gngkDg1HW5P9v5GdWWiCi3DWwvw5XnzjSPwNwVPN5DSck3AaiF"; // <-- compressed WIF format
// const tokenReceiverAddress     = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu"; // <-- must be simpleledger format
// const batonReceiverAddress     = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu";
// const bchChangeReceiverAddress = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu"; // <-- cashAddr or slpAddr format
// const tokenIdHexToMint = "495322b37d6b2eae81f045eda612b95870a0c2b6069c58f70cf8ef4e6a9fd43a";
// let additionalTokenQty = 1000

const slpValidator = new slpjs.LocalValidator(BITBOX, BITBOX.RawTransactions.getRawTransaction);
const bitboxNetwork = new slpjs.BitboxNetwork(BITBOX, slpValidator);

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
// Install BITBOX-SDK v3.0.2+ instance for blockchain access
// For more information visit: https://www.npmjs.com/package/bitbox-sdk
const BITBOXSDK = require('bitbox-sdk/lib/bitbox-sdk').default
const BigNumber = require('bignumber.js');
const slpjs = require('slpjs').slpjs;

// FOR MAINNET UNCOMMENT
// const BITBOX = new BITBOXSDK({ restURL: 'https://rest.bitcoin.com/v2/' });
// const fundingAddress           = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu"; // <-- must be slpAddr format
// const fundingWif               = "L3gngkDg1HW5P9v5GdWWiCi3DWwvw5XnzjSPwNwVPN5DSck3AaiF";    // <-- compressed WIF format
// const tokenReceiverAddress     = "simpleledger:qqr3a3c9wsdqljmwvy58rvp0yd25qmk3gqyrendudw"; // <-- must be slpAddr format
// const bchChangeReceiverAddress = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu"; // <-- cashAddr or slpAddr format
// let tokenId = "495322b37d6b2eae81f045eda612b95870a0c2b6069c58f70cf8ef4e6a9fd43a";
// let sendAmount = 10;

// FOR TESTNET UNCOMMENT
const BITBOX = new BITBOXSDK({ restURL: 'https://trest.bitcoin.com/v2/' });
const fundingAddress           = "slptest:qpwyc9jnwckntlpuslg7ncmhe2n423304ueqcyw80l"; // <-- must be slpAddr format
const fundingWif               = "cVjzvdHGfQDtBEq7oddDRcpzpYuvNtPbWdi8tKQLcZae65G4zGgy"; // <-- compressed WIF format
const tokenReceiverAddress     = "slptest:qpwyc9jnwckntlpuslg7ncmhe2n423304ueqcyw80l"; // <-- must be slpAddr format
const bchChangeReceiverAddress = "slptest:qpwyc9jnwckntlpuslg7ncmhe2n423304ueqcyw80l"; // <-- cashAddr or slpAddr format
let tokenId = "a67e2abb2fcfaa605c6a3b0dfb642cc830b63138d85b5e95eee523fdbded4d74";
let sendAmount = 10;

const slpValidator = new slpjs.LocalValidator(BITBOX, BITBOX.RawTransactions.getRawTransaction);
const bitboxNetwork = new slpjs.BitboxNetwork(BITBOX, slpValidator);

// 1) Fetch critical token information
let tokenDecimals;
(async function() {
    const tokenInfo = await bitboxNetwork.getTokenInformation(tokenId);
    tokenDecimals = tokenInfo.decimals; 
    console.log("Token precision: " + tokenDecimals.toString());
})();

// 2) Check that token balance is greater than our desired sendAmount
let balances; 
(async function() {
  balances = await bitboxNetwork.getAllSlpBalancesAndUtxos(fundingAddress);
  console.log("'balances' variable is set.");
  console.log("Token balance:", balances.slpTokenBalances[tokenId].toNumber() / 10**tokenDecimals)
})();

// Wait for network responses...

// 3) Calculate send amount in "Token Satoshis".  In this example we want to just send 1 token unit to someone...
sendAmount = (new BigNumber(sendAmount)).times(10**tokenDecimals);  // Don't forget to account for token precision

// 4) Get all of our token's UTXOs
let inputUtxos = balances.slpTokenUtxos[tokenId]

// 5) Simply sweep our BCH utxos to fuel the transaction
inputUtxos = inputUtxos.concat(balances.nonSlpUtxos);

// 6) Set the proper private key for each Utxo
inputUtxos.forEach(txo => txo.wif = fundingWif)

// 7) Send token
let sendTxid;
(async function(){
    sendTxid = await bitboxNetwork.simpleTokenSend(
        tokenId, 
        sendAmount, 
        inputUtxos, 
        tokenReceiverAddress, 
        bchChangeReceiverAddress
        )
    console.log("SEND txn complete:",sendTxid);
})();
```



## SLP Address Conversion

```javascript
let Utils = require('slpjs').slpjs.Utils;

let slpAddr = Utils.toSlpAddress("bitcoincash:qzat5lfxt86mtph2fdmp96stxdmmw8hchyxrcmuhqf");
console.log(slpAddr);
// simpleledger:qzkpdhw8xwe2x2dt7mqtxwjrpfnlrclkwqvhlgwxy8

let cashAddr = Utils.toCashAddress(slpAddr);
console.log(cashAddr);
// bitcoincash:qzat5lfxt86mtph2fdmp96stxdmmw8hchyxrcmuhqf
```



# Caveats

* All SLPJS methods require token quantities to be expressed in the smallest possible unit of account for the token (i.e., token satoshis).  This requires the token's precision to be used to calculate the quantity. For example, token having a decimal precision of 9 sending an amount of 1.01 tokens would need to first calculate the sending amount using `1.01 x 10^9 => 1010000000`.



# Building & Testing

Building this project creates lib/*.js files and then creates browserified versions in the dist folder.

## Requirements
Running the unit tests require node.js v8.15+. 

## Build
`npm run build`

## Test
`npm run test`