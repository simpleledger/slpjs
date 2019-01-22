# SLPJS

SLPJS is a JavaScript Library for building Simple Ledger Protocol (SLP) token transactions.  

GENESIS and SEND transaction types are currently supported for [SLP Token Type 1](https://github.com/simpleledger/slp-specification/blob/master/slp-token-type-1.md).  

For convenience, BITBOX and bitdb network functionality have been built into the library.  However, SLP-SDK may be more appropriate in some instances.

[![NPM](https://nodei.co/npm/slpjs.png)](https://nodei.co/npm/slpjs/)



# Installation

#### For node.js
`npm install slpjs`

#### For browser
```<script src='https://unpkg.com/slpjs'></script>```



# Example Usage

The following examples show how this library should be used. For convenience, the SLPJS library has  functionality built-in for BITBOX and bitdb proxy networks.

The [BigNumber.js library](https://github.com/MikeMcl/bignumber.js) is used to avoid precision issues with numbers having more than 15 significant digits.



## Get Token Balances

```typescript
// Bring your own BITBOX instance for blockchain access
const BITBOXSDK = require('../node_modules/bitbox-sdk/lib/bitbox-sdk').default
const BITBOX = new BITBOXSDK({ restURL: 'https://rest.bitcoin.com/v1/' });

const slpjs = require('./').slpjs;
const bitboxNetwork = new slpjs.BitboxNetwork(BITBOX, 'https://validate.simpleledger.info');

let balances;
(async function() {
  let addr = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu";
  balances = await bitboxNetwork.getAllSlpBalancesAndUtxos(addr);
  console.log("balances: ", balances);
})();

// RETURNS ALL BALANCES & UTXOs: 
// { satoshis_available_not_slp: 190889,
//   satoshis_locked_in_slp_minting_baton: 546,
//   satoshis_locked_in_slp_token: 1092,
//   slpTokenBalances: {
//      '1cda254d0a995c713b7955298ed246822bee487458cd9747a91d9e81d9d28125': BigNumber { s: 1, e: 3, c: [ 1000 ] },
//      '047918c612e94cce03876f1ad2bd6c9da43b586026811d9b0d02c3c3e910f972': BigNumber { s: 1, e: 2, c: [ 100 ] } 
//   },
//   slpTokenUtxos: [ ... ],
//   slpBatonUtxos: [ ... ],
//   nonSlpUtxos: [ ... ]
// }
```



## Send Token Workflow

This example shows the general workflow for sending an existing token.  You must have a sufficient balance of BCH (satoshis) and the specific token in order to perform a send.  The method `simpleTokenSend()` is provided as an example of how to use this library.  Most likely you will need to replace `simepleTokenSend()` with your own method to achieve your specific tramnsaction goals.

```typescript

// Bring your own BITBOX instance for blockchain access
const BITBOXSDK = require('../node_modules/bitbox-sdk/lib/bitbox-sdk').default
const BITBOX = new BITBOXSDK({ restURL: 'https://rest.bitcoin.com/v1/' });
const BigNumber = require('bignumber.js');

const slpjs = require('./').slpjs;
const bitboxNetwork = new slpjs.BitboxNetwork(BITBOX, 'https://validate.simpleledger.info');
const bitdbProxy = new slpjs.BitdbProxy();

const fundingAddress           = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu"; // <-- must be bitcoincash format
const fundingWif               = "L3gngkDg1HW5P9v5GdWWiCi3DWwvw5XnzjSPwNwVPN5DSck3AaiF"; // <-- compressed WIF format
const tokenReceiverAddress     = "simpleledger:qqcq9evjk56ql02djeg2r8srety9uvpdmyh667zfwz"; // <-- must be simpleledger format
const bchChangeReceiverAddress = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu"; // <-- simpleledger or bitcoincash format

// 1) Set the token of interest for send transaction
let tokenId = "4458aa2b84cc336c3948642def94af473395ace3689bf70f6183c40f14842911";

// 2) Fetch critical token information using bitdb
let tokenDecimals;
(async function() {
    const tokenInfo = await bitdbProxy.getTokenInformation(tokenId);
    tokenDecimals = tokenInfo.decimals; 
    console.log("Token precision: " + tokenDecimals.toString());
})();

// Wait for network response....

// 3) Check that token balance is greater than our desired sendAmount
let balances; 
(async function() {
  balances = await bitboxNetwork.getAllSlpBalancesAndUtxos(fundingAddress);
  console.log(balances.slpTokenBalances);
})();

// Wait for network response...

// 4) Calculate send amount in "Token Satoshis".  In this example we want to just send 1 token unit to someone...
let sendAmount = (new BigNumber(1)).times(10**tokenDecimals);  // Don't forget to account for token precision

// 5) Check for sufficient Token Balance
if(tokenId in balances.slpTokenBalances){
    let balance = balances.slpTokenBalances[tokenId].times(10**tokenDecimals);
    console.log("Token balance: " + balance.toString());
    if(sendAmount > balance)
        console.log("Insufficient token balance!");
} else {
    console.log("Token has 0 balance");
}

// TODO: Check there is sufficient BCH balance to fund miners fee.  Look at balances.satoshis_available value.

// 6) Send token
let txid;
(async function(){
    txid = await bitboxNetwork.simpleTokenSend(tokenId, sendAmount, fundingAddress, fundingWif, tokenReceiverAddress, bchChangeReceiverAddress);
    console.log("token send complete.");
})();
```



## The Remainder of this Document Needs Reworked



<!-- ## Creating a new SLP token - GENESIS Transaction

Creating a new token requires a special OP_RETURN message be the first output of the Genesis transaction.  The `buildGenesisOpReturn()` and `buildRawGenesisTx()` methods are used to generate a properly formatted metadata message and the raw transaction hex.  Creating a token is the most simple type of SLP transaction since no special inputs are required.

NOTE: All slpjs functions require token quantities to be expressed as the token amount calculated with the token's decimal precision.  For example, token having a decimal precision of 2 that is sending an amount of 1.01 tokens would need to first calculate the sending amount using `1.01 x 10^2 => 101`.  

```javascript
let slp = require('slpjs').slp
let network = require('slpjs').bitbox
let BigNumber = require('bignumber.js')

let fundingAddress           = ""; // <-- must be bitcoincash format
let fundingWif               = ""; // <-- compressed WIF format
let tokenReceiverAddress     = ""; // <-- must be simpleledger format
let batonReceiverAddress     = ""; // <-- must be simpleledger format
let bchChangeReceiverAddress = ""; // <-- simpleledger or bitcoincash format

// 1) Assume the first utxo at the given address has enough funds to fund this example.
let utxo;
(async function(){
    let txos = await network.getUtxoWithRetry(fundingAddress);
    utxo = txos[txos.length-1]; // UTXOs are sorted small to large, so grab biggest one to be conservative.
})();

// NOTE: Wait for utxo response before we proceed to next step...

// 2) Select decimal precision for this new token
let decimals = 9;

// 3) Select initial token quantity to issue
let initialQty = (new BigNumber(1000000)).times(10**decimals);

// 3) Create the genesis OP_RETURN metadata message
let genesisOpReturn = slp.buildGenesisOpReturn({ 
    ticker: "TOKEN21",
    name: "21st Century Token",
    urlOrEmail: "info@slp.cash",
    hash: null, 
    decimals: decimals,
    batonVout: 2,
    initialQuantity: initialQty,
});

// 4) Create/sign the raw transaction hex for Genesis
let genesisTxHex = slp.buildRawGenesisTx({
    slpGenesisOpReturn: genesisOpReturn, 
    mintReceiverAddress: tokenReceiverAddress,
    mintReceiverSatoshis: 546,
    batonReceiverAddress: batonReceiverAddress,
    batonReceiverSatoshis: 546,
    bchChangeReceiverAddress: bchChangeReceiverAddress, 
    input_utxos: [{
        txid: utxo.txid,
        vout: utxo.vout,
        satoshis: utxo.satoshis,
        wif: fundingWif
    }]
});

// 5) Broadcast the raw transaction hex to the network using BITBOX
let genesisTxid;
(async function(){
    genesisTxid = await network.sendTx(genesisTxHex);
})();

```

### Address Conversion to SLP address format

```javascript
let utils = require('slpjs').utils

let slpAddr = utils.toSlpAddress("bitcoincash:qzat5lfxt86mtph2fdmp96stxdmmw8hchyxrcmuhqf");
console.log(slpAddr);
// simpleledger:qzkpdhw8xwe2x2dt7mqtxwjrpfnlrclkwqvhlgwxy8

let cashAddr = utils.toCashAddress(slpAddr);
console.log(cashAddr);
// bitcoincash:qzat5lfxt86mtph2fdmp96stxdmmw8hchyxrcmuhqf
​``` -->


```