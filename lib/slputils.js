let BITBOXCli = require('bitbox-cli/lib/bitbox-cli').default
let BITBOX = new BITBOXCli()

let bchaddr = require('bchaddrjs-slp');

class SlpUtils {

    static toLegacyAddress(address){
        return bchaddr.toLegacyAddress(address);
    }

    static toCashAddress(address){
        return bchaddr.toCashAddress(address);
    }

    static toSlpAddress(address){
        return bchaddr.toSlpAddress(address);
    }

    static getPushDataOpcode(data) {
        let length = data.length

        if (length === 0)
            return [0x4c, 0x00]
        else if (length < 76)
            return length
        else if (length < 256)
            return [0x4c, length]
        else
            throw Error("Pushdata too large")
    }

    static int2FixedBuffer(amount, byteLength) {
        let hex = parseInt(amount, 10).toString(16)
        const len = hex.length
        for (let i = 0; i < byteLength*2 - len; i++) {
            hex = '0' + hex;
        }
        
        let buffer = Buffer.from(hex, 'hex')
        return buffer
    }

    static encodeScript(script) {
        const bufferSize = script.reduce((acc, cur) => {
            if (Array.isArray(cur)) return acc + cur.length
            else return acc + 1
        }, 0)

        const buffer = Buffer.allocUnsafe(bufferSize)
        let offset = 0
        script.forEach((scriptItem) => {
            if (Array.isArray(scriptItem)) {
                scriptItem.forEach((item) => {
                    buffer.writeUInt8(item, offset)
                    offset += 1
                })
            } else {
                buffer.writeUInt8(scriptItem, offset)
                offset += 1
            }
        })

        return buffer
    }

    static txidFromHex(hex) {
        let buffer = Buffer.from(hex, "hex")
        let hash = BITBOX.Crypto.hash256(buffer).toString('hex')
        return hash.match(/[a-fA-F0-9]{2}/g).reverse().join('')
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

    static validateSlpAddress(slpAddr){

    }
}

module.exports = SlpUtils