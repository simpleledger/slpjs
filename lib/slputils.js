let BITBOXCli = require('bitbox-cli/lib/bitbox-cli').default
let BITBOX = new BITBOXCli()
let cashaddr = require('cashaddrjs-slp');

class SlpUtils {

    static slpToCashAddr(slpAddr){
        let { prefix, type, hash } = cashaddr.decode(slpAddr);
        prefix = 'bitcoincash'
        return cashaddr.encode(prefix, type, hash);
    }

    static cashToSlpAddr(cashAddr){
        let { prefix, type, hash } = cashaddr.decode(cashAddr);
        prefix = 'simpleledger'
        return cashaddr.encode(prefix, type, hash);
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
}

module.exports = SlpUtils