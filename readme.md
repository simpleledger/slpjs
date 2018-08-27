# slpjs

[![NPM](https://nodei.co/npm/slpjs.png)](https://nodei.co/npm/slpjs/)

JavaScript library for the Simple Ledger Protocol (SLP)

### Install
#### node.js
`npm install slpjs`
#### browser
`<script src='https://unpkg.com/slpjs'></script>`

### GENESIS op_return serialization & network txn

```
let slp = require('slpjs').slp
let network = require('slpjs').network

let genesisOpReturn = slp.buildGenesisOpReturn(
    ticker,
    name,
    urlOrEmail,
    decimalPlaces,
    batonVout,
    initialQuantity,
)

let genesisChangeUtxo = await network.sendGenesisTx(this.address, this.keyPair, genesisOpReturn, batonAddress)
let genesisTxid = genesisChangeUtxo.txid
```

### SEND op_return serialization & network txn

```
let slp = require('slpjs').slp
let network = require('slpjs').network

let sendOpReturn = slp.buildSendOpReturn(
    genesisTxid,
    this.state.tokenProps.decimalPlaces,
    outputQtyArray,
)

let sendTxid = await network.sendSendTx(keyPair, genesisChangeUtxo, sendOpReturn, outputAddressArray, paymentAddress)

```

### Address conversion

```
let slputils = require('slpjs').slputils

var slpAddr = slputils.toSlpAddress("bitcoincash:qzat5lfxt86mtph2fdmp96stxdmmw8hchyxrcmuhqf");
console.log(slpAddr);
// simpleledger:qzkpdhw8xwe2x2dt7mqtxwjrpfnlrclkwqvhlgwxy8

var cashAddr = slputils.toCashAddress(slpAddr);
console.log(cashAddr);
// bitcoincash:qzat5lfxt86mtph2fdmp96stxdmmw8hchyxrcmuhqf
```