import network from './network'
import slptokentype1 from './slptokentype1'

let BITBOXCli = require('bitbox-cli/lib/bitbox-cli').default
let BITBOX = new BITBOXCli()

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

class Slp {
    constructor() {
        let mnemonic = BITBOX.Mnemonic.generate(256)
        let rootSeed = BITBOX.Mnemonic.toSeed(mnemonic)
        let masterHDNode = BITBOX.HDNode.fromSeed(rootSeed, 'bitcoincash')
        let hdNode = BITBOX.HDNode.derivePath(masterHDNode, "m/44'/145'/0'")
        let node0 = BITBOX.HDNode.derivePath(hdNode, "0/0")
        this.keyPair = BITBOX.HDNode.toKeyPair(node0)
        let wif = BITBOX.ECPair.toWIF(this.keyPair)
        let ecPair = BITBOX.ECPair.fromWIF(wif)
        this.address = BITBOX.ECPair.toLegacyAddress(ecPair)
        this.cashAddress = BITBOX.Address.toCashAddress(this.address)

        // TODO: Save mnemonic to local storage for emergency recovery
    }
    buildGenesisOpReturn(ticker, name, urlOrEmail, decimals, batonVout, initialQuantity) {
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

    buildSendOpReturn(tokenIdHex, decimals, outputQtyArray) {
        return slptokentype1.buildSendOpReturn(
            0x01,
            tokenIdHex,
            decimals,
            outputQtyArray            
        )
    }

    calcFee(batonAddress, outputAddressArray) {
        let genesisFee = this.calcGenesisFee(batonAddress)
        let sendFee = this.calcSendFee(outputAddressArray)
        return genesisFee + sendFee
    }

    calcGenesisFee(batonAddress) {
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

    calcSendFee(outputAddressArray) {
        let outputs = 5 + outputAddressArray.length

        let fee = BITBOX.BitcoinCash.getByteCount({ P2PKH: 1 }, { P2PKH: outputs })
        fee += outputAddressArray.length * 546

        return fee
    }

    async monitorForPayment(fee, onPaymentCB) {
        while (true) {
            try {
                let utxo = await network.getUtxo(this.address)
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

    async sendGenesisTx(genesisOpReturn, batonAddress) {
        // TODO: Check for fee too large or send leftover to target address

        let utxo = await network.getUtxo(this.address)
        console.log('utxo: ', utxo)

        let changeVout = 1
        let transactionBuilder = new BITBOX.TransactionBuilder('bitcoincash')
        transactionBuilder.addInput(utxo.txid, utxo.vout)

        let fee = this.calcGenesisFee(batonAddress)
        let satoshisAfterFee = utxo.satoshis - fee + 546

        // Genesis OpReturn
        transactionBuilder.addOutput(genesisOpReturn, 0)

        // Genesis token mint
        transactionBuilder.addOutput(this.address, satoshisAfterFee)

        // Baton address (optional)
        if (batonAddress != null) {
            transactionBuilder.addOutput(batonAddress, 546)
        }

        let redeemScript
        transactionBuilder.sign(0, this.keyPair, redeemScript, transactionBuilder.hashTypes.SIGHASH_ALL, utxo.satoshis)

        let hex = transactionBuilder.build().toHex()

        let txid = await network.sendTx(hex)

        // TODO: Retry sendTx & Calculate txid on tx exists
        // SlpUtils.txidFromHex(hex)

        // Return change utxo
        return {
            txid: txid,
            vout: changeVout,
            satoshis: satoshisAfterFee,
        }
    }

    async sendSendTx(utxo, sendOpReturn, outputAddressArray, changeAddress) {
        let transactionBuilder = new BITBOX.TransactionBuilder('bitcoincash')
        transactionBuilder.addInput(utxo.txid, utxo.vout)

        let fee = this.calcSendFee(outputAddressArray)
        let satoshisAfterFee = utxo.satoshis - fee

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
        transactionBuilder.sign(0, this.keyPair, redeemScript, transactionBuilder.hashTypes.SIGHASH_ALL, utxo.satoshis)

        let hex = transactionBuilder.build().toHex()

        let txid = await network.sendTx(hex)

        return txid
    }
    
}

export default Slp