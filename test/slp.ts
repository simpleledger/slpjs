// import { Slp } from '../lib/slp';
// import * as assert from 'assert';
// import { BITBOX } from 'bitbox-sdk';

// const bitbox = new BITBOX({ restURL: "https://trest.bitcoin.com/v2/" });
// const scriptUnitTestData = require('slp-unit-test-data/script_tests.json');

// let slp = new Slp(bitbox);

// describe('Slp', function() {

//     describe('parseSlpOutputScript() -- SLP OP_RETURN Unit Tests', function() {
//         scriptUnitTestData.forEach((test: any)=> {
//             it(test.msg, () => {
//                 let script = Buffer.from(test.script, 'hex');
//                 let eCode = test.code;
//                 if(eCode) {
//                     assert.throws(function() { slp.parseSlpOutputScript(script) });
//                 } else {
//                     let parsedOutput = slp.parseSlpOutputScript(script);
//                     assert(typeof parsedOutput, 'object');
//                 }
//             });
//         });
//     });
//     // describe('buildGenesisTransaction()', function() {

//     // })
//     // describe('buildMintTransaction()', function() {
        
//     // })
//     // describe('buildSendTransaction()', function() {
        
//     // })

//     // let genesisTxid;
//     // let batonTxid;
//     // let sendTxid;

//     // describe('buildRawGenesisTx()', function() {
//     //     const fundingAddress           = "slptest:qpwyc9jnwckntlpuslg7ncmhe2n423304ueqcyw80l";
//     //     const fundingWif               = "cVjzvdHGfQDtBEq7oddDRcpzpYuvNtPbWdi8tKQLcZae65G4zGgy";
//     //     const tokenReceiverAddress     = "slptest:qr0mkh2lf6w4cz79n8rwjtf65e0swqqleu3eyzn6s4";
//     //     const batonReceiverAddress     = "slptest:qpwyc9jnwckntlpuslg7ncmhe2n423304ueqcyw80l";
//     //     const bchChangeReceiverAddress = "slptest:qpwyc9jnwckntlpuslg7ncmhe2n423304ueqcyw80l";

//     //     it('Succeeds in creating a valid genesis transaction with override on validateSlpTransactions', async () => {
//     //         this.timeout(5000);
//     //         let balances = await bitboxNetwork.getAllSlpBalancesAndUtxos(fundingAddress);
//     //         console.log(balances);
//     //         let decimals = 9;
//     //         let initialQty = (new BigNumber(1000000)).times(10**decimals);
            
//     //         let genesisOpReturn = slp.buildGenesisOpReturn({ 
//     //             ticker: null,
//     //             name: null,
//     //             documentUri: null,
//     //             hash: null, 
//     //             decimals: decimals,
//     //             batonVout: 2,
//     //             initialQuantity: initialQty,
//     //         });

//     //         balances.nonSlpUtxos.forEach(utxo => utxo.wif = fundingWif)

//     //         let genesisTxHex = slp.buildRawGenesisTx({
//     //             slpGenesisOpReturn: genesisOpReturn, 
//     //             mintReceiverAddress: tokenReceiverAddress,
//     //             batonReceiverAddress: batonReceiverAddress,
//     //             bchChangeReceiverAddress: bchChangeReceiverAddress, 
//     //             input_utxos: balances.nonSlpUtxos
//     //         });

//     //         genesisTxid = await BITBOX.RawTransactions.sendRawTransaction(genesisTxHex);
            
//     //         let re = /^([A-Fa-f0-9]{2}){32,32}$/;
//     //         console.log(genesisTxHex);
//     //         assert.equal(true, re.test(genesisTxid));
//     //         assert.equal(true, false);
//     //     });
//     // });
//     // describe('buildRawSendTx()', function() {
//     //     it('works', () => {
//     //         assert.equal(true, false);
//     //     });
//     // });
//     // describe('buildRawMintTx()', function() {
//     //     it('works', () => {
//     //         assert.equal(true, false);
//     //     });
//     // });
// });