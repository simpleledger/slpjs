# slpjs

Simple Ledger Protocol (SLP) JavaScript Library for building and sending token transactions using BITBOX network.  Genesis and Send transactions are currently supported.

[![NPM](https://nodei.co/npm/slpjs.png)](https://nodei.co/npm/slpjs/)



# Installation

#### For node.js
`npm install slpjs`

#### For browser
```<script src='https://unpkg.com/slpjs'></script>```



# Example Usage

The following examples show how this library should be used.

## Creating a new SLP token - GENESIS

Creating a new token requires the Genesis OP_RETURN metadata message to be built and used within a properly formatted Genesis transaction.  The `buildGenesisOpReturn()` and `buildRawGenesisTx()` methods are used to generate a properly formatted metadata message and raw transaction hex.  For convenience, the SLPJS library has BITBOX network functionality built-in.

```javascript

let slp = require('slpjs').slp
let network = require('slpjs').network

let utxo = await network.getUtxoWithRetry("bitcoincash:...");

let genesisOpReturn = slp.buildGenesisOpReturn({ 
    ticker: "TOKEN21",
    name: "A new token for fractional accounting",
    urlOrEmail: "issuer@gmx.com",
    hash: null, 
    decimals: 9,
    batonVout: null,
    initialQuantity: new BigNumber(1000000),
})

let genesisTxHex = slp.buildRawGenesisTx({
    slpGenesisOpReturn: genesisOpReturn, 
    mintReceiverAddress: "simpleledger:qr0kk59jfk7ya5cu5xe9edxtntleu9psr5w80zy4q9",
    mintReceiverSatoshis: 546,
    batonReceiverAddress: "simpleledger:qr0kk59jfk7ya5cu5xe9edxtntleu9psr5w80zy4q9",
    batonReceiverSatoshis: 546,
    bchChangeReceiverAddress: "simpleledger:qr0kk59jfk7ya5cu5xe9edxtntleu9psr5w80zy4q9", 
    input_utxos: [{
        utxo_txid: utxo.txid,
        utxo_vout: utxo.vout,
        utxo_satoshis: utxo.satoshis,
    }],
    wif: "<private key>"
})

let txid = await network.sendTx(genesisTxHex)
```

## Transfer an existing Token - SEND

```javascript

let slp = require('slpjs').slp
let network = require('slpjs').network

let sendOpReturn = slp.buildSendOpReturn({
    tokenIdHex: genesisTxid,
    outputQtyArray: outputQtyArray,
})

let sendTxHex = slp.buildRawSendTx({
    slpSendOpReturn: sendOpReturn,
    input_token_utxos: [{ 
        token_utxo_txid: <some utxo for a token>,
        token_utxo_vout: 1,
        token_utxo_satoshis: 546
    },
    { 
        token_utxo_txid: <some other utxo>,
        token_utxo_vout: 1,
        token_utxo_satoshis: <some utxo qty to cover fees>
    }],
    tokenReceiverAddressArray: ["simpleledger:qr0kk59jfk7ya5cu5xe9edxtntleu9psr5w80zy4q9"],
    bchChangeReceiverAddress: "simpleledger:qr0kk59jfk7ya5cu5xe9edxtntleu9psr5w80zy4q9",
    wif: "<private key>"
})
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