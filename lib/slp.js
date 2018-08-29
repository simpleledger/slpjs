let BITBOXCli = require('bitbox-cli/lib/bitbox-cli').default;
let BITBOX = new BITBOXCli();
let bchaddr = require('bchaddrjs-slp');

let slptokentype1 = require('./slptokentype1');
var slputils = require('./slputils');

class Slp {

    // Example config:
    // let config = {
    //     ticker: "", 
    //     name: "",
    //     urlOrEmail: "", 
    //     hash: null,
    //     decimals: 0, 
    //     batonVout: 2, // normally this is null (for fixed supply) or 2 for flexible
    //     initialQuantity: 1000000
    // }
    static buildGenesisOpReturn(config, type=0x01) {
        return slptokentype1.buildGenesisOpReturn(
            config.ticker,
            config.name,
            config.urlOrEmail,
            config.hash,
            config.decimals,
            config.batonVout,
            config.initialQuantity
        )
    }

    // Example config:
    // let config = {
    //     tokenIdHex: "", 
    //     decimals: 0, 
    //     outputQtyArray: []
    // }
    static buildSendOpReturn(config, type=0x01) {
        return slptokentype1.buildSendOpReturn(
            config.tokenIdHex,
            config.decimals,
            config.outputQtyArray            
        )
    }

    // Example config: 
    // let config = {
    //     slpGenesisOpReturn: genesisOpReturn, 
    //     mintReceiverAddress: this.slpAddress,
    //     batonReceiverAddress: batonAddress,
    //     utxo_txid: utxo.txid,
    //     utxo_vout: utxo.vout,
    //     utxo_satoshis: utxo.satoshis,
    //     wif: this.wif
    //   }
    static buildRawGenesisTx(config, type=0x01){
        // Check for slp format addresses

        if(!bchaddr.isSlpAddress(config.mintReceiverAddress)){
            throw new Error("Not an SLP address.");
        }

        if(config.batonReceiverAddress != null && !bchaddr.isSlpAddress(config.batonReceiverAddress)){
            throw new Error("Not an SLP address.");
        }

        config.mintReceiverAddress = bchaddr.toCashAddress(config.mintReceiverAddress);

        // TODO: Check for fee too large or send leftover to target address

        let transactionBuilder = new BITBOX.TransactionBuilder('bitcoincash')
        transactionBuilder.addInput(config.utxo_txid, config.utxo_vout)

        let fee = slputils.calculateGenesisFee(config.batonReceiverAddress)
        let satoshisAfterFee = config.utxo_satoshis - fee + 546

        // Genesis OpReturn
        transactionBuilder.addOutput(config.slpGenesisOpReturn, 0)

        // Genesis token mint
        transactionBuilder.addOutput(config.mintReceiverAddress, satoshisAfterFee)

        // Baton address (optional)
        if (config.batonReceiverAddress != null) {
            config.batonReceiverAddress = bchaddr.toCashAddress(config.batonReceiverAddress);
            transactionBuilder.addOutput(config.batonReceiverAddress, 546)
        }

        let paymentKeyPair = BITBOX.ECPair.fromWIF(config.wif)

        let redeemScript
        transactionBuilder.sign(0, paymentKeyPair, redeemScript, transactionBuilder.hashTypes.SIGHASH_ALL, config.utxo_satoshis)

        return {
            hex: transactionBuilder.build().toHex(),
            satoshis: satoshisAfterFee
        }
    }

    // Example config: 
    // let configSendTx = {
    //     slpSendOpReturn: sendOpReturn,
    //     input_token_utxos: [ 
    //       { 
    //         token_utxo_txid: genesisTxid,
    //         token_utxo_vout: 1,
    //         token_utxo_satoshis: genesisTxData.satoshis 
    //       }
    //     ],
    //     tokenReceiverAddressArray: outputAddressArray,
    //     bchChangeAddress: this.state.paymentAddress,
    //     wif: this.wif
    //   }
    static buildRawSendTx(config, type=0x01){       
        let transactionBuilder = new BITBOX.TransactionBuilder('bitcoincash')
        var satoshis = 0;
        config.input_token_utxos.forEach(token_utxo => {
            transactionBuilder.addInput(token_utxo.token_utxo_txid, token_utxo.token_utxo_vout)
            satoshis = satoshis + token_utxo.token_utxo_satoshis
        });

        let fee = slputils.calculateSendFee(config.tokenReceiverAddressArray)
        let satoshisAfterFee = satoshis - fee

        // Genesis OpReturn
        transactionBuilder.addOutput(config.slpSendOpReturn, 0)

        // Token distribution outputs
        config.tokenReceiverAddressArray.forEach((outputAddress) => {
            // Check for slp format addresses
            if(!bchaddr.isSlpAddress(outputAddress)){
                throw new Error("Not an SLP address.");
            }
            outputAddress = bchaddr.toCashAddress(outputAddress);
            transactionBuilder.addOutput(outputAddress, 546)
        })

        // Change
        if (satoshisAfterFee >= 546) {
            transactionBuilder.addOutput(config.bchChangeAddress, satoshisAfterFee)
        }

        let paymentKeyPair = BITBOX.ECPair.fromWIF(config.wif)

        let redeemScript
        transactionBuilder.sign(0, paymentKeyPair, redeemScript, transactionBuilder.hashTypes.SIGHASH_ALL, satoshis)

        return transactionBuilder.build().toHex()

        // let txid = await this.sendTx(hex)

        // return txid
    }
}

module.exports = Slp