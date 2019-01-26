
import { Slp } from './slp';
import { Utils } from './utils';
import { BitdbNetwork } from './bitdbnetwork';
import { JsonRpcProxyValidator } from './jsonrpcvalidator';
import { BitboxNetwork } from './bitboxnetwork';

exports.Slp = Slp;
exports.Utils = Utils;
exports.BitboxNetwork = BitboxNetwork;
exports.BitdbNetwork = BitdbNetwork;
exports.JsonRpcProxyValidator = JsonRpcProxyValidator;

import BigNumber from "bignumber.js";
import { AddressUtxoResult } from "bitbox-sdk/typings/Address";

export enum SlpTransactionType {
    "GENESIS", "MINT", "SEND"
}

export enum SlpTypeVersion {
    "TokenType1" = 1
}

// negative values are bad, 0 = NOT_SLP, possitive values are a SLP (token or baton)
export enum SlpUtxoJudgement {
    "UNKNOWN" = -2, "INVALID_DAG", "NOT_SLP", "SLP_TOKEN", "SLP_BATON"
}

export interface SlpTransactionDetails {
    transactionType: SlpTransactionType;
    tokenIdHex: string;
    type: SlpTypeVersion;
    timestamp: string;
    symbol: string;
    name: string;
    documentUri: string; 
    documentSha256: Buffer|null;
    decimals: number;
    containsBaton: boolean;
    batonVout: number|null;
    genesisOrMintQuantity: BigNumber|null;
    sendOutputs?: BigNumber[]|null;
}

export interface SlpTokenBalanceMap {
    [key: string]: BigNumber;
}

export interface SlpBalancesResult {
    satoshis_available_bch_not_slp: number;
    satoshis_in_slp_minting_baton: number;
    satoshis_in_slp_token: number;
    slpTokenBalances: SlpTokenBalanceMap;
    slpTokenUtxos: SlpAddressUtxoResult[];
    slpBatonUtxos: SlpAddressUtxoResult[];
    nonSlpUtxos: SlpAddressUtxoResult[];
}

export class SlpAddressUtxoResult implements AddressUtxoResult {
    txid: string;
    vout: number;
    scriptPubKey: string;
    amount: number;
    satoshis: number;
    height: number;
    confirmations: number;
    legacyAddress: string;
    cashAddress: string;
    wif: string;
    tx: TxnDetailsDeep;
    slpTokenDetails: SlpTransactionDetails;
    slpJudgement: SlpUtxoJudgement = SlpUtxoJudgement.UNKNOWN;
}

export interface ScriptPubKey{
    hex: string;
    asm: string;
    addresses: string[];
    type: string;
}

export interface Vout {
    value: Number;
    n: number;
    scriptPubKey: ScriptPubKey;
}

export interface Vin {
    txid: string;
    sequence: number;
    n: number;
    scriptSig: ScriptSig;
    value: number;
    legacyAddress: string;
    cashAddress: string 
}

export interface ScriptSig {
    hex: string;
    asm: string;
}

// Needed more type details than available in BITBOX types
export interface TxnDetailsDeep {
    txid: string;
    version: number;
    locktime: number;
    vin: Vin[];
    vout: Vout[];
    blockhash: string;
    blockheight: number;
    confirmations: number;
    time: number;
    blocktime: number;
    isCoinBase: boolean;
    valueOut: number;
    size: number;
}