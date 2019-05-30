import { SlpAddressUtxoResult, utxo, SlpPaymentRequest } from '../index';

import { AddressUtxoResult } from 'bitcoin-com-rest';
import * as Bchaddr from 'bchaddrjs-slp';
import BigNumber from 'bignumber.js';

export class Utils {
    static isCashAddress(address: string): any {
        try {
            return Bchaddr.isCashAddress(address);
        } catch(_) {
            return false;
        }
    }

    static toCashAddress(address: string) {
        return Bchaddr.toCashAddress(address);
    }

    static slpAddressFromHash160(hash: Uint8Array, network='mainnet', addressType='p2pkh'): string {
        if(network !== 'mainnet' && network !== 'testnet')
            throw Error("Invalid network given.")
        if(addressType !== 'p2pkh' && addressType !== 'p2sh')
            throw Error("Invalid address type given.")
        return Bchaddr.encodeAsSlpaddr({ hash: hash, type: addressType, network: network, format: "" })
    }

    static isSlpAddress(address: string) {
        try {
            return Bchaddr.isSlpAddress(address);
        } catch(_) {
            return false;
        }
    }

    static toSlpAddress(address: string) {
        return Bchaddr.toSlpAddress(address);
    }

    static isLegacyAddress(address: string){
        try {
            return Bchaddr.isLegacyAddress(address);
        } catch(_) {
            return false;
        }
    }

    static toLegacyAddress(address: string) {
        return Bchaddr.toLegacyAddress(address);
    }

    static isMainnet(address: string) {
        if(Bchaddr.decodeAddress(address).network === 'mainnet')
            return true
        return false
    }

    static txnBuilderString(address: string) {
        return Utils.isMainnet(address) ? 'bitcoincash' : 'bchtest';
    }

    static mapToSlpAddressUtxoResultArray(bitboxResult: AddressUtxoResult) {
        return bitboxResult.utxos.map(txo => {
            return <SlpAddressUtxoResult> {
                satoshis: txo.satoshis,
                txid: txo.txid,
                amount: txo.amount,
                confirmations: txo.confirmations,
                height: txo.height,
                vout: txo.vout,
                cashAddress: bitboxResult.cashAddress,
                legacyAddress: bitboxResult.legacyAddress,
                scriptPubKey: bitboxResult.scriptPubKey
            }
        })
    }

    static mapToUtxoArray(utxos: SlpAddressUtxoResult[]) {
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

    static buffer2BigNumber(amount: Buffer) {
        if(amount.length < 5 || amount.length > 8)
            throw Error("Buffer must be between 4-8 bytes in length");
        return (new BigNumber(amount.readUInt32BE(0).toString())).multipliedBy(2**32).plus(amount.readUInt32BE(4).toString());
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

    static buildSlpUri(address: string, amountBch?: number, amountToken?: number, tokenId?: string): string {
        let uri = "";
        if(!this.isSlpAddress(address))
            throw Error("Not a valid SLP address");
        if(address.startsWith("simpleledger:"))
            uri = uri.concat(address);
        else
            uri = uri.concat("simpleledger:" + address);
        if(amountBch || amountToken)
            uri = uri.concat("?");
        let n: number = 0;
        if(amountBch) {
            uri = uri.concat("amount=" + amountBch.toString());
            n++;
        }
        if(amountToken) {
            if(!tokenId)
                throw Error("Missing tokenId parameter");
            let re = /^([A-Fa-f0-9]{2}){32,32}$/;
            if(!re.test(tokenId))
                throw Error("TokenId is invalid, must be 32-byte hexidecimal string");
            if (n > 0)
                uri = uri.concat("&amount" + n.toString() + "=" + amountToken.toString() + "-" + tokenId);
            else
                uri = uri.concat("amount" + "=" + amountToken.toString() + "-" + tokenId);
        }
        return uri;
    }

    static parseSlpUri(uri: string): SlpPaymentRequest {
        if(!uri.startsWith("simpleledger:"))
            throw Error("Input does not start with 'simpleledger:'");
        else
            uri = uri.replace("simpleledger:", "");
        let splitUri = uri.split('?');
        if(splitUri.length > 2)
            throw Error("Cannot have character '?' more than once.");
        if(!this.isSlpAddress(splitUri[0]))
            throw Error("Address is not an SLP formatted address.");
        let result: SlpPaymentRequest = { address: "simpleledger:" + splitUri[0] };
        if(splitUri.length > 1) {
            splitUri = splitUri[1].split('&');
            let paramNames: string[] = [];
            splitUri.forEach(param => {
                if(param.split('=').length === 2) {
                    let str = param.split('=');
                    if(paramNames.includes(str[0]))
                        throw Error("Cannot have duplicate parameter names in URI string");
                    if(str[0].startsWith('amount') && str[1].split('-').length === 1) {
                        result.amountBch = parseFloat(str[1]);
                    } else if(str[0].startsWith('amount') && str[1].split('-').length > 1) {
                        let p = str[1].split('-');
                        if(p.length > 2)
                            throw Error("Token flags params not yet implemented.");
                        let re = /^([A-Fa-f0-9]{2}){32,32}$/;
                        if(p.length > 1 && !re.test(p[1]))
                            throw Error("Token id in URI is not a valid 32-byte hexidecimal string");
                        result.amountToken = parseFloat(p[0]);
                        result.tokenId = p[1];
                    }
                    paramNames.push(str[0]);
                }
            });
        }
        return result;
    }

    static get_BIP62_locktime_hex(unixtime: number){
        return Utils.convertBE2LE32(unixtime.toString(16));
    }

    // convert Big Endian to Little Endian for the given Hex string
    static convertBE2LE32(hex: string) {
        if (hex === '') return null;
        if (!Utils.isHexString(hex)) return null;
        if (hex.length % 2 > 0)
            hex = '0' + hex;
        hex = hex.match(/.{2}/g)!.reverse().join('');
        return hex;
    };

    // check validation of hex string
    static isHexString(hex: string) {
        let regexp = /^[0-9a-fA-F]+$/;
        if (!regexp.test(hex)) return false;
        return true;
    };
}