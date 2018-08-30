# slpjs


[![NPM](https://nodei.co/npm/slpjs.png)](https://nodei.co/npm/slpjs/)

JavaScript library for the Simple Ledger Protocol (SLP).  Currently only GENESIS and SEND transactions are supported in this library.

### Install
#### node.js
`npm install slpjs`
#### browser
`<script src='https://unpkg.com/slpjs'></script>`

### GENESIS OP_RETURN & txn serialization

```
let slp = require('slpjs').slp
let network = require('slpjs').network

let utxo = await network.getUtxoWithRetry("bitcoincash:...");

let genesisOpReturn = slp.buildGenesisOpReturn({ 
    ticker: "some ticker",
    name: "a good token name",
    urlOrEmail: "email@google.com",
    hash: null, 
    decimals: 9,
    batonVout: null,
    initialQuantity: 1000000,
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

### SEND OP_RETURN & txn serialization

```
let slp = require('slpjs').slp
let network = require('slpjs').network

let sendOpReturn = slp.buildSendOpReturn({
    tokenIdHex: genesisTxid,
    decimals: this.state.tokenProps.decimalPlaces, 
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

### SimpleLedger Address Conversion

```
let utils = require('slpjs').utils

var slpAddr = utils.toSlpAddress("bitcoincash:qzat5lfxt86mtph2fdmp96stxdmmw8hchyxrcmuhqf");
console.log(slpAddr);
// simpleledger:qzkpdhw8xwe2x2dt7mqtxwjrpfnlrclkwqvhlgwxy8

var cashAddr = utils.toCashAddress(slpAddr);
console.log(cashAddr);
// bitcoincash:qzat5lfxt86mtph2fdmp96stxdmmw8hchyxrcmuhqf
```