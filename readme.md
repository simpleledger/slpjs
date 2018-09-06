# slpjs

SLPJS is a JavaScript Library for building Simple Ledger Protocol (SLP) token transactions.  GENESIS and SEND transaction types are currently supported for [SLP Token Type 1](https://github.com/simpleledger/slp-specification/blob/master/slp-token-type-1.md).  For convenience, BITBOX and bitdb network functionality have been built into the library.


[![NPM](https://nodei.co/npm/slpjs.png)](https://nodei.co/npm/slpjs/)


# Installation

#### For node.js
`npm install slpjs`

#### For browser
```<script src='https://unpkg.com/slpjs'></script>```


# Example Usage

The following examples show how this library should be used. For convenience, the SLPJS library has BITBOX and bitdb network functionality built-in and are used within these examples.

The [BigNumber.js library](https://github.com/MikeMcl/bignumber.js) is used to avoid precision issues with numbers having more than 15 significant digits.

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
    urlOrEmail: "issuer@gmx.com",
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

## Sending an existing token - SEND Transaction

Creating a SEND transaction is similar to creating a GENESIS transaction, except the outputs from a previous token transaction should be included as inputs in the SEND transaction.  A special SEND transaction OP_RETURN message is created using `buildSendOpReturn()` method and and added as the first output of the transaction.  The SEND transaction hex is created using the `buildRawSendTx()` method.

NOTE: In order to fetch token information using bitdb you will need to register with the [bitdb.network](https://bitdb.network) website to obtain an API key.

```javascript
let slp = require('slpjs').slp
let network = require('slpjs').bitbox
let bitdb = require('slpjs').bitdb
let BigNumber = require('bignumber.js')

let BITDB_KEY                = ""; // <-- visit http://bitdb.network for api key
let fundingAddress           = ""; // <-- must be bitcoincash format
let fundingWif               = ""; // <-- compressed WIF format
let tokenReceiverAddress     = ""; // <-- must be simpleledger format
let bchChangeReceiverAddress = ""; // <-- simpleledger or bitcoincash format

// 1) Set the token of interest for send transaction
let tokenId = "c950c236ae779c8c3b35bffd6e19a64c3adda13ab6d3215fc8f664200b433d0f";

// 2) Fetch criticial token information using bitdb
let tokenDecimals;
(async function(){
    const { tokenName, tokenPrecision } = await bitdb.getTokenInformation(tokenId, BITDB_KEY);
    tokenDecimals = tokenPrecision; 
})();

// Wait for network response...

// 3) Get all utxos for our address and filter out UTXOs for other tokens
let inputSet = [];
let validTokenQuantity = new BigNumber(0);
(async function(){
    let utxoSet = await network.getUtxoWithTxDetails(fundingAddress);
    for(let utxo of utxoSet){
        try {
            utxo.slp = slp.decodeTxOut(utxo);
            if(utxo.slp.token != tokenId)
                continue;
            validTokenQuantity = validTokenQuantity.plus(utxo.slp.quantity);
        } catch(_) {}
        
        // sweeping is easiest way to manage coin selection
        inputSet.push(utxo);
    }
})();

// Wait for network response...

inputSet = inputSet.map(utxo => ({ txid: utxo.txid, vout: utxo.vout, satoshis: utxo.satoshis, wif: fundingWif }));

// 4) Set the token send amounts, we'll send 100 tokens to a new receiver and send token change back to the sender
let tokenSendAmount = (new BigNumber(100)).times(10**tokenDecimals);
let tokenChangeAmount = validTokenQuantity.minus(tokenSendAmount);

// 5) Create the Send OP_RETURN message
let sendOpReturn = slp.buildSendOpReturn({
    tokenIdHex: tokenId,
    outputQtyArray: [tokenSendAmount, tokenChangeAmount],
})

// 6) Create the raw Send transaction hex
let sendTxHex = slp.buildRawSendTx({
    slpSendOpReturn: sendOpReturn,
    input_token_utxos: inputSet,
    tokenReceiverAddressArray: [
        tokenReceiverAddress, tokenReceiverAddress
    ],
    bchChangeReceiverAddress: bchChangeReceiverAddress
})

// 7) Broadcast the transaction over the network using BITBOX
let sendTxid;
(async function(){
    sendTxid = await network.sendTx(sendTxHex);
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
