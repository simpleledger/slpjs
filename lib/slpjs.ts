
import { Slp } from './slp';
import { Utils } from './utils';
import { BitdbNetwork } from './bitdbnetwork';
import { JsonRpcProxyValidator } from './jsonrpcvalidator';
import { LocalValidator } from './localvalidator';
import { BitboxNetwork } from './bitboxnetwork';

exports.Slp = Slp;
exports.Utils = Utils;
exports.BitboxNetwork = BitboxNetwork;
exports.BitdbNetwork = BitdbNetwork;
exports.JsonRpcProxyValidator = JsonRpcProxyValidator;
exports.LocalValidator = LocalValidator;

import BigNumber from "bignumber.js";

export enum SlpTransactionType {
    "GENESIS", "MINT", "SEND"
}

export enum SlpTypeVersion {
    "TokenVersionType1" = 1
}

// negative values are bad, 0 = NOT_SLP, positive values are a SLP (token or baton)
export enum SlpUtxoJudgement {
    "UNKNOWN" = -3, "INVALID_BATON_DAG", "INVALID_TOKEN_DAG", "NOT_SLP", "SLP_TOKEN", "SLP_BATON"
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

export interface SlpBalancesResult {
    satoshis_available_bch: number;
    satoshis_in_slp_baton: number;
    satoshis_in_slp_token: number;
    satoshis_in_invalid_token_dag: number;
    satoshis_in_invalid_baton_dag: number;
    slpTokenBalances: {[key: string]: BigNumber};
    slpTokenUtxos: {[key: string]: SlpAddressUtxoResult[]};
    slpBatonUtxos: {[key: string]: SlpAddressUtxoResult[]};
    nonSlpUtxos: SlpAddressUtxoResult[];
    invalidTokenUtxos: SlpAddressUtxoResult[];
    invalidBatonUtxos: SlpAddressUtxoResult[];
}

export class SlpAddressUtxoResult {
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
    slpTransactionDetails: SlpTransactionDetails;
    slpUtxoJudgement: SlpUtxoJudgement = SlpUtxoJudgement.UNKNOWN;
    slpUtxoJudgementAmount: BigNumber
}

export interface utxo {
    txid: string;
    vout: number;
    satoshis: BigNumber;
    wif: string;
    slpTransactionDetails: SlpTransactionDetails;
    slpUtxoJudgement: SlpUtxoJudgement;
    slpUtxoJudgementAmount: BigNumber;
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