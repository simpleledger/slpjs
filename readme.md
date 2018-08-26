# slp-lib

[![NPM](https://nodei.co/npm/slp-lib.png)](https://nodei.co/npm/slp-lib/)

### slp address format conversion usage

```
let SlpUtils = require('slp-lib').slputils

var slpAddr = SlpUtils.cashToSlpAddr("bitcoincash:qzat5lfxt86mtph2fdmp96stxdmmw8hchyxrcmuhqf");
console.log(slpAddr);
// simpleledger:qzkpdhw8xwe2x2dt7mqtxwjrpfnlrclkwqvhlgwxy8

var cashAddr = SlpUtils.slpToCashAddr(slpAddr);
console.log(cashAddr);
// bitcoincash:qzat5lfxt86mtph2fdmp96stxdmmw8hchyxrcmuhqf

```