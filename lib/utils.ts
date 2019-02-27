import { SlpAddressUtxoResult, utxo } from "../index";

import { AddressUtxoResult } from "bitbox-sdk/lib/Address";
import * as Bchaddr from "bchaddrjs-slp";
import BigNumber from "bignumber.js";

export class Utils {
  static isCashAddress(address: string): any {
    return Bchaddr.isCashAddress(address);
  }

  static toCashAddress(address: string) {
    return Bchaddr.toCashAddress(address);
  }

  static toSlpAddress(address: string) {
    return Bchaddr.toSlpAddress(address);
  }

  static isSlpAddress(address: string) {
    return Bchaddr.isSlpAddress(address);
  }

  static isMainnet(address: string) {
    if (Bchaddr.decodeAddress(address).network === "mainnet") return true;
    return false;
  }

  // TODO change is here
  static txnBuilderString(address: string) {
    return Utils.isMainnet(address) ? "mainnet" : "testnet";
  }

  static mapToSlpAddressUtxoResultArray(bitboxResult: AddressUtxoResult) {
    return bitboxResult.utxos.map(txo => {
      return <SlpAddressUtxoResult>{
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
  }

  static mapToUtxoArray(utxos: SlpAddressUtxoResult[]) {
    return utxos.map(txo => {
      return <utxo>{
        satoshis: new BigNumber(txo.satoshis),
        wif: txo.wif,
        txid: txo.txid,
        vout: txo.vout,
        slpTransactionDetails: txo.slpTransactionDetails,
        slpUtxoJudgement: txo.slpUtxoJudgement,
        slpUtxoJudgementAmount: txo.slpUtxoJudgementAmount
      };
    });
  }

  static getPushDataOpcode(data: number[] | Buffer) {
    let length = data.length;

    if (length === 0) return [0x4c, 0x00];
    else if (length < 76) return length;
    else if (length < 256) return [0x4c, length];

    throw Error("Pushdata too large");
  }

  static int2FixedBuffer(amount: BigNumber) {
    try {
      amount.absoluteValue();
    } catch (_) {
      throw Error("Amount must be an instance of BigNumber");
    }

    let hex: string = amount.toString(16);
    hex = hex.padStart(16, "0");
    return Buffer.from(hex, "hex");
  }

  // This is for encoding Script in scriptPubKey OP_RETURN scripts, where BIP62.3 does not apply
  static encodeScript(script: (number | number[])[]) {
    const bufferSize = <number>script.reduce((acc: number, cur) => {
      if (Array.isArray(cur)) return acc + cur.length;
      else return acc + 1;
    }, 0);

    const buffer = Buffer.allocUnsafe(bufferSize);
    let offset = 0;
    script.forEach(scriptItem => {
      if (Array.isArray(scriptItem)) {
        scriptItem.forEach(item => {
          buffer.writeUInt8(item, offset);
          offset += 1;
        });
      } else {
        buffer.writeUInt8(scriptItem, offset);
        offset += 1;
      }
    });

    return buffer;
  }
}
