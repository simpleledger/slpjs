let network = require('./network')
let slptokentype1 = require('./slptokentype1')

let BITBOXCli = require('bitbox-cli/lib/bitbox-cli').default
let BITBOX = new BITBOXCli()

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

class Slp {
    static buildGenesisOpReturn(ticker, name, urlOrEmail, decimals, batonVout, initialQuantity) {
        return slptokentype1.buildGenesisOpReturn(
            0x01,
            ticker,
            name,
            urlOrEmail,
            null,
            decimals,
            batonVout,
            initialQuantity
        )
    }

    static buildSendOpReturn(tokenIdHex, decimals, outputQtyArray) {
        return slptokentype1.buildSendOpReturn(
            0x01,
            tokenIdHex,
            decimals,
            outputQtyArray            
        )
    }

    static calculateFee(batonAddress, outputAddressArray) {
        let genesisFee = this.calculateGenesisFee(batonAddress)
        let sendFee = this.calculateSendFee(outputAddressArray)
        return genesisFee + sendFee
    }

    static calculateGenesisFee(batonAddress) {
        let outputs = 4
        let dustOutputs = 1

        if (batonAddress != null) {
            outputs += 1
            dustOutputs += 1
        }

        let fee = BITBOX.BitcoinCash.getByteCount({ P2PKH: 1 }, { P2PKH: outputs })
        fee += dustOutputs * 546

        return fee
    }

    static calculateSendFee(outputAddressArray) {
        let outputs = 5 + outputAddressArray.length

        let fee = BITBOX.BitcoinCash.getByteCount({ P2PKH: 1 }, { P2PKH: outputs })
        fee += outputAddressArray.length * 546

        return fee
    }

    static async monitorForPayment(paymentAddress, fee, onPaymentCB) {
        while (true) {
            try {
                let utxo = await network.getUtxo(paymentAddress)
                if (utxo && utxo.satoshis >= fee) {
                    break
                }
            } catch (ex) {
                console.log(ex)
            }

            await sleep(5000)
        }

        onPaymentCB()
    }

    static async sendGenesisTx(paymentAddress, paymentKeyPair, genesisOpReturn, batonAddress) {
        // TODO: Check for fee too large or send leftover to target address

        let utxo = await network.getUtxo(paymentAddress)

        let changeVout = 1
        let transactionBuilder = new BITBOX.TransactionBuilder('bitcoincash')
        transactionBuilder.addInput(utxo.txid, utxo.vout)

        let fee = this.calculateGenesisFee(batonAddress)
        let satoshisAfterFee = utxo.satoshis - fee + 546

        // Genesis OpReturn
        transactionBuilder.addOutput(genesisOpReturn, 0)

        // Genesis token mint
        transactionBuilder.addOutput(paymentAddress, satoshisAfterFee)

        // Baton address (optional)
        if (batonAddress != null) {
            transactionBuilder.addOutput(batonAddress, 546)
        }

        let redeemScript
        transactionBuilder.sign(0, paymentKeyPair, redeemScript, transactionBuilder.hashTypes.SIGHASH_ALL, utxo.satoshis)

        let hex = transactionBuilder.build().toHex()

        let txid = await network.sendTx(hex)

        // TODO: Retry sendTx & Calculate txid on tx exists
        // txid = SlpUtils.txidFromHex(hex)

        // Return change utxo
        return {
            txid: txid,
            vout: changeVout,
            satoshis: satoshisAfterFee,
        }
    }

    static async sendSendTx(genesisUtxo, sendOpReturn, outputAddressArray, changeAddress) {
        let transactionBuilder = new BITBOX.TransactionBuilder('bitcoincash')
        transactionBuilder.addInput(genesisUtxo.txid, genesisUtxo.vout)

        let fee = this.calculateSendFee(outputAddressArray)
        let satoshisAfterFee = genesisUtxo.satoshis - fee

        // Genesis OpReturn
        transactionBuilder.addOutput(sendOpReturn, 0)

        // Token distribution outputs
        outputAddressArray.forEach((outputAddress) => {
            transactionBuilder.addOutput(outputAddress, 546)
        })

        // Change
        if (satoshisAfterFee >= 546) {
            transactionBuilder.addOutput(changeAddress, satoshisAfterFee)
        }

        let redeemScript
        transactionBuilder.sign(0, paymentKeyPair, redeemScript, transactionBuilder.hashTypes.SIGHASH_ALL, genesisUtxo.satoshis)

        let hex = transactionBuilder.build().toHex()

        let txid = await network.sendTx(hex)

        return txid
    }
    
}

module.exports = Slp