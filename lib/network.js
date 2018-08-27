let BITBOXCli = require('bitbox-cli/lib/bitbox-cli').default;
let BITBOX = new BITBOXCli();

let slputils = require('./slputils');
let bchaddr = require('bchaddrjs-slp');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

class Network {
    static async getUtxo(address) {
        return new Promise( (resolve, reject) => {
            BITBOX.Address.utxo(address).then((result) => {
                if (!result || !result.length || !result[0].satoshis) {
                    reject(null)
                }

                let utxo = result.sort((a, b) => { return a.satoshis - b.satoshis })[result.length-1]
                resolve(utxo)
            }, (err) => { 
                console.log(err)
                reject(err)
            })
        })
    }

    static async sendTx(hex) {
        return new Promise( (resolve, reject) => {
            BITBOX.RawTransactions.sendRawTransaction(hex).then((result) => { 
                console.log("txid: ", result)
                if (result.length != 64) {
                    reject("Transaction failed: ", result)
                }
                else {
                    resolve(result)
                }
            }, (err) => { 
                console.log(err)
                reject(err)
            })
        })
    }

    static async monitorForPayment(paymentAddress, fee, onPaymentCB) {
        while (true) {
            try {
                let utxo = await this.getUtxo(paymentAddress)
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
        // Check for slp format addresses

        if(!bchaddr.isSlpAddress(paymentAddress)){
            throw new Error("Not an SLP address.");
        }

        if(batonAddress != null && !bchaddr.isSlpAddress(batonAddress)){
            throw new Error("Not an SLP address.");
        }

        paymentAddress = bchaddr.toCashAddress(paymentAddress);
        batonAddress = bchaddr.toCashAddress(batonAddress);

        // TODO: Check for fee too large or send leftover to target address

        let utxo = await this.getUtxo(paymentAddress)

        let changeVout = 1
        let transactionBuilder = new BITBOX.TransactionBuilder('bitcoincash')
        transactionBuilder.addInput(utxo.txid, utxo.vout)

        let fee = slputils.calculateGenesisFee(batonAddress)
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

        let txid = await this.sendTx(hex)

        // TODO: Retry sendTx & Calculate txid on tx exists
        // txid = SlpUtils.txidFromHex(hex)

        // Return change utxo
        return {
            txid: txid,
            vout: changeVout,
            satoshis: satoshisAfterFee,
        }
    }

    static async sendSendTx(paymentKeyPair, genesisUtxo, sendOpReturn, outputAddressArray, changeAddress) {        
        let transactionBuilder = new BITBOX.TransactionBuilder('bitcoincash')
        transactionBuilder.addInput(genesisUtxo.txid, genesisUtxo.vout)

        let fee = slputils.calculateSendFee(outputAddressArray)
        let satoshisAfterFee = genesisUtxo.satoshis - fee

        // Genesis OpReturn
        transactionBuilder.addOutput(sendOpReturn, 0)

        // Token distribution outputs
        outputAddressArray.forEach((outputAddress) => {
            // Check for slp format addresses
            if(!bchaddr.isSlpAddress(outputAddress)){
                throw new Error("Not an SLP address.");
            }
            outputAddress = bchaddr.toCashAddress(outputAddress);
            transactionBuilder.addOutput(outputAddress, 546)
        })

        // Change
        if (satoshisAfterFee >= 546) {
            transactionBuilder.addOutput(changeAddress, satoshisAfterFee)
        }

        let redeemScript
        transactionBuilder.sign(0, paymentKeyPair, redeemScript, transactionBuilder.hashTypes.SIGHASH_ALL, genesisUtxo.satoshis)

        let hex = transactionBuilder.build().toHex()

        let txid = await this.sendTx(hex)

        return txid
    }
}

module.exports = Network