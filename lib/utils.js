const BITBOXCli = require("bitbox-cli/lib/bitbox-cli").default,
    BITBOX = new BITBOXCli(),
    network = require("../lib/bitboxnetwork"),
    bitdb = require("../lib/bitdbproxy"),
    BigNumber = require("bignumber.js"),
    bchaddr = require("bchaddrjs-slp");

class Utils {

    static toCashAddress(address){
        return bchaddr.toCashAddress(address);
    }

    static toSlpAddress(address){
        return bchaddr.toSlpAddress(address);
    }

    static isSlpAddress(address){
        return bchaddr.isSlpAddress(address);
    }

    static async getSatoshiBalance(address) {
        let UTXO = await network.getUtxoWithTxDetails(address);

        let verifiedTransactions = await bitdb.verifyTransactions([
            ...new Set(UTXO.map(txOut => txOut.txid))
        ]);

        const map = {
            satoshis: 0
        };

        for (const txOut of UTXO) {
            if ("slp" in txOut && validSLPTx.includes(txOut.txid)) {
                if (!(txOut.slp.token in map)) {
                    map[txOut.slp.token] = new BigNumber(0);
                }
                map[txOut.slp.token] = map[txOut.slp.token].plus(
                    txOut.slp.quantity
                );
            } else {
                map.satoshis += txOut.satoshis;
            }
        }
        return map;
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

    static int2FixedBuffer(amount) {
        if(!amount._isBigNumber)
            throw Error("Amount must be an instance of BigNumber");

        let hex = amount.toString(16);
        hex = hex.padStart(16, '0')
        return Buffer.from(hex, 'hex');
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

    // Method to get Script 32-bit integer (little-endian signed magnitude representation)
	static readScriptInt32(buffer) {
		let number;
		if(buffer.readUInt32LE(0) > 2147483647)
			number = -1 * (buffer.readUInt32LE(0) - 2147483648);
		else
			number = buffer.readUInt32LE(0);
		return number;
	}

	// Method to check whether or not a secret value is valid
	static secretIsValid(buffer) {
		let number = this.readScriptInt32(buffer);
		if(number > 1073741823 || number < -1073741823)
			return false;
		return true;
	}

	static generateSecretNumber() {
		let secret = BITBOX.Crypto.randomBytes(32);
		while(!this.secretIsValid(secret)){
			secret = BITBOX.Crypto.randomBytes(32);
		}
		return secret;
	}
}

module.exports = Utils