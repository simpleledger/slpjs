"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Bchaddr = require("bchaddrjs-slp");
var bignumber_js_1 = require("bignumber.js");
var Utils = /** @class */ (function () {
    function Utils() {
    }
    Utils.isCashAddress = function (address) {
        try {
            return Bchaddr.isCashAddress(address);
        }
        catch (_) {
            return false;
        }
    };
    Utils.toCashAddress = function (address) {
        return Bchaddr.toCashAddress(address);
    };
    Utils.slpAddressFromHash160 = function (hash, network, addressType) {
        if (network === void 0) { network = 'mainnet'; }
        if (addressType === void 0) { addressType = 'p2pkh'; }
        if (network !== 'mainnet' && network !== 'testnet')
            throw Error("Invalid network given.");
        if (addressType !== 'p2pkh' && addressType !== 'p2sh')
            throw Error("Invalid address type given.");
        return Bchaddr.encodeAsSlpaddr({ hash: hash, type: addressType, network: network, format: "" });
    };
    Utils.isSlpAddress = function (address) {
        try {
            return Bchaddr.isSlpAddress(address);
        }
        catch (_) {
            return false;
        }
    };
    Utils.toSlpAddress = function (address) {
        return Bchaddr.toSlpAddress(address);
    };
    Utils.isLegacyAddress = function (address) {
        try {
            return Bchaddr.isLegacyAddress(address);
        }
        catch (_) {
            return false;
        }
    };
    Utils.toLegacyAddress = function (address) {
        return Bchaddr.toLegacyAddress(address);
    };
    Utils.isMainnet = function (address) {
        if (Bchaddr.decodeAddress(address).network === 'mainnet')
            return true;
        return false;
    };
    Utils.txnBuilderString = function (address) {
        return Utils.isMainnet(address) ? 'bitcoincash' : 'bchtest';
    };
    Utils.mapToSlpAddressUtxoResultArray = function (bitboxResult) {
        return bitboxResult.utxos.map(function (txo) {
            return {
                satoshis: txo.satoshis,
                txid: txo.txid,
                amount: txo.amount,
                confirmations: txo.confirmations,
                height: txo.height,
                vout: txo.vout,
                cashAddress: bitboxResult.cashAddress,
                legacyAddress: bitboxResult.legacyAddress,
                scriptPubKey: bitboxResult.scriptPubKey
            };
        });
    };
    Utils.mapToUtxoArray = function (utxos) {
        return utxos.map(function (txo) {
            return {
                satoshis: new bignumber_js_1.default(txo.satoshis),
                wif: txo.wif,
                txid: txo.txid,
                vout: txo.vout,
                slpTransactionDetails: txo.slpTransactionDetails,
                slpUtxoJudgement: txo.slpUtxoJudgement,
                slpUtxoJudgementAmount: txo.slpUtxoJudgementAmount
            };
        });
    };
    Utils.getPushDataOpcode = function (data) {
        var length = data.length;
        if (length === 0)
            return [0x4c, 0x00];
        else if (length < 76)
            return length;
        else if (length < 256)
            return [0x4c, length];
        throw Error("Pushdata too large");
    };
    Utils.int2FixedBuffer = function (amount) {
        try {
            amount.absoluteValue();
        }
        catch (_) {
            throw Error("Amount must be an instance of BigNumber");
        }
        var hex = amount.toString(16);
        hex = hex.padStart(16, '0');
        return Buffer.from(hex, 'hex');
    };
    Utils.buffer2BigNumber = function (amount) {
        if (amount.length < 5 || amount.length > 8)
            throw Error("Buffer must be between 4-8 bytes in length");
        return (new bignumber_js_1.default(amount.readUInt32BE(0).toString())).multipliedBy(Math.pow(2, 32)).plus(amount.readUInt32BE(4).toString());
    };
    // This is for encoding Script in scriptPubKey OP_RETURN scripts, where BIP62.3 does not apply
    Utils.encodeScript = function (script) {
        var bufferSize = script.reduce(function (acc, cur) {
            if (Array.isArray(cur))
                return acc + cur.length;
            else
                return acc + 1;
        }, 0);
        var buffer = Buffer.allocUnsafe(bufferSize);
        var offset = 0;
        script.forEach(function (scriptItem) {
            if (Array.isArray(scriptItem)) {
                scriptItem.forEach(function (item) {
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
    };
    Utils.buildSlpUri = function (address, amountBch, amountToken, tokenId) {
        var uri = "";
        if (!this.isSlpAddress(address))
            throw Error("Not a valid SLP address");
        if (address.startsWith("simpleledger:"))
            uri = uri.concat(address);
        else
            uri = uri.concat("simpleledger:" + address);
        if (amountBch || amountToken)
            uri = uri.concat("?");
        var n = 0;
        if (amountBch) {
            uri = uri.concat("amount=" + amountBch.toString());
            n++;
        }
        if (amountToken) {
            if (!tokenId)
                throw Error("Missing tokenId parameter");
            var re = /^([A-Fa-f0-9]{2}){32,32}$/;
            if (!re.test(tokenId))
                throw Error("TokenId is invalid, must be 32-byte hexidecimal string");
            if (n > 0)
                uri = uri.concat("&amount" + n.toString() + "=" + amountToken.toString() + "-" + tokenId);
            else
                uri = uri.concat("amount" + "=" + amountToken.toString() + "-" + tokenId);
        }
        return uri;
    };
    Utils.parseSlpUri = function (uri) {
        if (!uri.startsWith("simpleledger:"))
            throw Error("Input does not start with 'simpleledger:'");
        else
            uri = uri.replace("simpleledger:", "");
        var splitUri = uri.split('?');
        if (splitUri.length > 2)
            throw Error("Cannot have character '?' more than once.");
        if (!this.isSlpAddress(splitUri[0]))
            throw Error("Address is not an SLP formatted address.");
        var result = { address: "simpleledger:" + splitUri[0] };
        if (splitUri.length > 1) {
            splitUri = splitUri[1].split('&');
            var paramNames_1 = [];
            splitUri.forEach(function (param) {
                if (param.split('=').length === 2) {
                    var str = param.split('=');
                    if (paramNames_1.includes(str[0]))
                        throw Error("Cannot have duplicate parameter names in URI string");
                    if (str[0].startsWith('amount') && str[1].split('-').length === 1) {
                        result.amountBch = parseFloat(str[1]);
                    }
                    else if (str[0].startsWith('amount') && str[1].split('-').length > 1) {
                        var p = str[1].split('-');
                        if (p.length > 2)
                            throw Error("Token flags params not yet implemented.");
                        var re = /^([A-Fa-f0-9]{2}){32,32}$/;
                        if (p.length > 1 && !re.test(p[1]))
                            throw Error("Token id in URI is not a valid 32-byte hexidecimal string");
                        result.amountToken = parseFloat(p[0]);
                        result.tokenId = p[1];
                    }
                    paramNames_1.push(str[0]);
                }
            });
        }
        return result;
    };
    Utils.get_BIP62_locktime_hex = function (unixtime) {
        return Utils.convertBE2LE32(unixtime.toString(16));
    };
    // convert Big Endian to Little Endian for the given Hex string
    Utils.convertBE2LE32 = function (hex) {
        if (hex === '')
            return null;
        if (!Utils.isHexString(hex))
            return null;
        if (hex.length % 2 > 0)
            hex = '0' + hex;
        hex = hex.match(/.{2}/g).reverse().join('');
        return hex;
    };
    ;
    // check validation of hex string
    Utils.isHexString = function (hex) {
        var regexp = /^[0-9a-fA-F]+$/;
        if (!regexp.test(hex))
            return false;
        return true;
    };
    ;
    return Utils;
}());
exports.Utils = Utils;
//# sourceMappingURL=utils.js.map