"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bchaddrjs_1 = require("bchaddrjs");
class Utils {
    constructor(BITBOX) {
        this.BITBOX = this.BITBOX;
    }
    toCashAddress(address) {
        return bchaddrjs_1.default.toCashAddress(address);
    }
    toSlpAddress(address) {
        return bchaddrjs_1.default.toSlpAddress(address);
    }
    isSlpAddress(address) {
        return bchaddrjs_1.default.isSlpAddress(address);
    }
    static getPushDataOpcode(data) {
        let length = data.length;
        if (length === 0)
            return [0x4c, 0x00];
        else if (length < 76)
            return length;
        else if (length < 256)
            return [0x4c, length];
        throw Error("Pushdata too large");
    }
    static int2FixedBuffer(amount) {
        try {
            amount.absoluteValue();
        }
        catch (_) {
            throw Error("Amount must be an instance of BigNumber");
        }
        let hex = amount.toString(16);
        hex = hex.padStart(16, '0');
        return Buffer.from(hex, 'hex');
    }
    // This is for encoding Script in scriptPubKey OP_RETURN scripts, where BIP62.3 does not apply
    static encodeScript(script) {
        const bufferSize = script.reduce((acc, cur) => {
            if (Array.isArray(cur))
                return acc + cur.length;
            else
                return acc + 1;
        }, 0);
        const buffer = Buffer.allocUnsafe(bufferSize);
        let offset = 0;
        script.forEach((scriptItem) => {
            if (Array.isArray(scriptItem)) {
                scriptItem.forEach((item) => {
                    buffer.writeUInt8(item, offset);
                    offset += 1;
                });
            }
            else {
                buffer.writeUInt8(scriptItem, offset);
                offset += 1;
            }
        });
        return buffer;
    }
    txidFromHex(hex) {
        let buffer = Buffer.from(hex, "hex");
        let hash = this.BITBOX.Crypto.hash256(buffer).toString('hex');
        return hash.match(/[a-fA-F0-9]{2}/g).reverse().join('');
    }
    // Method to get Script 32-bit integer (little-endian signed magnitude representation)
    readScriptInt32(buffer) {
        let number;
        if (buffer.readUInt32LE(0) > 2147483647)
            number = -1 * (buffer.readUInt32LE(0) - 2147483648);
        else
            number = buffer.readUInt32LE(0);
        return number;
    }
}
exports.Utils = Utils;
