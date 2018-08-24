let BITBOXCli = require('bitbox-cli/lib/bitbox-cli').default;
let BITBOX = new BITBOXCli();

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
}

export default Network