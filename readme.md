# slpjs

SLPJS is a JavaScript Library for building Simple Ledger Protocol (SLP) token transactions.  GENESIS and SEND transaction types are currently supported for [SLP Token Type 1](https://github.com/simpleledger/slp-specification/blob/master/slp-token-type-1.md).  For convenience, BITBOX and bitdb network functionality have been built into the library.


[![NPM](https://nodei.co/npm/slpjs.png)](https://nodei.co/npm/slpjs/)



# Installation

#### For node.js
`npm install slpjs`

#### For browser
```<script src='https://unpkg.com/slpjs'></script>```



# Usage

The following examples show how this library should be used. For convenience, the SLPJS library has BITBOX and bitdb network functionality built-in and are used within these examples.

The [BigNumber.js library](https://github.com/MikeMcl/bignumber.js) is used to avoid precision issues with numbers having more than 15 significant digits.



## GetAllTokenBalances() - for all token balances at an address

```javascript
let bitboxproxy = require('slpjs').bitbox;

let balances;
(async function() {
  let addr = "simpleledger:qz9tzs6d5097ejpg279rg0rnlhz546q4fsnck9wh5m";
  balances = await bitboxproxy.getAllTokenBalances(addr);
  console.log("balances: ", balances);
})();

// RETURNS ALL BALANCES: 
// NOTE: satoshis_avaliable = BCH funds not locked in SLP utxo

// { satoshis_available: 190889,
//   satoshis_locked_in_minting_baton: 546,
//   satoshis_locked_in_token: 1092,
//   '1cda254d0a995c713b7955298ed246822bee487458cd9747a91d9e81d9d28125': BigNumber { s: 1, e: 3, c: [ 1000 ] },
//   '047918c612e94cce03876f1ad2bd6c9da43b586026811d9b0d02c3c3e910f972': BigNumber { s: 1, e: 2, c: [ 100 ] } 
//   }

```



## sendToken() -  Sending an existing token

You will need to register with the [bitdb.network](https://bitdb.network) website to obtain an API key.

You must have a sufficient balance of BCH (satoshis) and the token in order to perform a send.

```javascript
let slp = require('slpjs').slp
let bitboxproxy = require('slpjs').bitbox
let bitdb = require('slpjs').bitdb
let BigNumber = require('bignumber.js')

let BITDB_KEY                = "qrg3fvfue463rc5genp2kyrj4mg6g2lpxst0y4wamw"; // <-- visit http://bitdb.network for your key
let fundingAddress           = "simpleledger:qz9tzs6d5097ejpg279rg0rnlhz546q4fsnck9wh5m"; // <-- must be bitcoincash format
let fundingWif               = "L44gh9WaAwhrQnRowTFFumHQ99TSuastDNErm3TYqbu3SxwcbunG"; // <-- compressed WIF format
let tokenReceiverAddress     = "simpleledger:qr8fxllmjeupamay8c8k6x3fvp2w2hp08yh6k4x5dz"; // <-- must be simpleledger format
let bchChangeReceiverAddress = "simpleledger:qz9tzs6d5097ejpg279rg0rnlhz546q4fsnck9wh5m"; // <-- simpleledger or bitcoincash format

// 1) Set the token of interest for send transaction
let tokenId = "1cda254d0a995c713b7955298ed246822bee487458cd9747a91d9e81d9d28125";

// 2) Fetch criticial token information using bitdb
let tokenDecimals;
(async function(){
    const { tokenName, tokenPrecision } = await bitdb.getTokenInformation(tokenId, BITDB_KEY);
    tokenDecimals = tokenPrecision; 
    console.log("Token precision: " + tokenPrecision.toString());
})();

// Wait for network response....

// 3) Calculate send amount in "Token Satoshis".  In this example we want to just send 1 token unit to someone...
let sendAmount = (new BigNumber(1)).times(10**tokenDecimals);  // Don't forget to account for token precision

// 4) Check that token balance is greater than our desired sendAmount
let balances; 
(async function() {
  balances = await bitboxproxy.getAllTokenBalances(fundingAddress);
  console.log(balances);
})();

// Wait for network response...

// Check for sufficient Token Balance
if(tokenId in balances){
    let balance = balances[tokenId].times(10**tokenDecimals);
    console.log("Token balance: " + balance.toString());
    if(sendAmount > balance)
        console.log("Insufficient token balance!");
} else {
    console.log("Token has 0 balance");
}

// TODO: Check there is sufficient BCH balance to fund miners fee.  Look at balances.satoshis_available value.

let txid;
(async function(){
    txid = await bitboxproxy.sendToken(tokenId, sendAmount, fundingAddress, fundingWif, tokenReceiverAddress, bchChangeReceiverAddress);
    console.log("token send complete.");
})();
```



## Creating a new SLP token - GENESIS Transaction

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
```

