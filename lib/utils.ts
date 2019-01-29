import BITBOX from '../node_modules/bitbox-sdk/typings/bitbox-sdk';
import * as bchaddr from 'bchaddrjs-slp';
import BigNumber from 'bignumber.js';
import { SlpAddressUtxoResult, utxo } from './slpjs';

export class Utils {
    BITBOX: BITBOX;

    constructor(BITBOX) {
        this.BITBOX = this.BITBOX;
    }

    toCashAddress(address: string) {
        return <string>bchaddr.toCashAddress(address);
    }

    toSlpAddress(address: string) {
        return <string>bchaddr.toSlpAddress(address);
    }

    isSlpAddress(address: string) {
        return <string>bchaddr.isSlpAddress(address);
    }

    static toUtxoArray(utxos: SlpAddressUtxoResult[]){
        return utxos.map(txo => 
        {
            return <utxo> { 
                satoshis: new BigNumber(txo.satoshis),
                wif: txo.wif,
                txid: txo.txid,
                vout: txo.vout,
                slpTransactionDetails: txo.slpTransactionDetails,
                slpUtxoJudgement: txo.slpUtxoJudgement,
                slpUtxoJudgementAmount: txo.slpUtxoJudgementAmount
            }
        })
    }

    static getPushDataOpcode(data: number[]|Buffer) {
        let length = data.length

        if (length === 0)
            return [0x4c, 0x00]
        else if (length < 76)
            return length
        else if (length < 256)
            return [0x4c, length]
        
        throw Error("Pushdata too large")
    }

    static int2FixedBuffer(amount: BigNumber) {
        try {
            amount.absoluteValue()
        } catch(_) {
            throw Error("Amount must be an instance of BigNumber");
        }

        let hex: string = amount.toString(16);
        hex = hex.padStart(16, '0');
        return Buffer.from(hex, 'hex');
    }

    // This is for encoding Script in scriptPubKey OP_RETURN scripts, where BIP62.3 does not apply
    static encodeScript(script: (number|number[])[]) {
        const bufferSize = <number>script.reduce((acc: number, cur) => {
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

    txidFromHex(hex) {
        let buffer = Buffer.from(hex, "hex")
        let hash = this.BITBOX.Crypto.hash256(buffer).toString('hex')
        return hash.match(/[a-fA-F0-9]{2}/g).reverse().join('')
    }

    // Method to get Script 32-bit integer (little-endian signed magnitude representation)
	readScriptInt32(buffer) {
		let number;
		if(buffer.readUInt32LE(0) > 2147483647)
			number = -1 * (buffer.readUInt32LE(0) - 2147483648);
		else
			number = buffer.readUInt32LE(0);
		return number;
	}
}
