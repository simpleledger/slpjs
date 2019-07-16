/// <reference path="./lib/vendors.d.ts"/>

export * from './lib/slp';
export * from './lib/utils';
export * from './lib/primatives';
export * from './lib/bitdbnetwork';
export * from './lib/localvalidator';
export * from './lib/bitboxnetwork';
export * from './lib/transactionhelpers';

import BigNumber from 'bignumber.js';

export interface logger {
    log: (s: string)=>any;
}

export enum SlpTransactionType {
    "GENESIS" = "GENESIS", 
    "MINT" = "MINT", 
    "SEND" = "SEND"
}

export enum SlpVersionType {
    "TokenVersionType1" = 1,
    "TokenVersionType1_NFT_Child" = 65,
    "TokenVersionType1_NFT_Parent" = 129
}

// negative values are bad, 0 = NOT_SLP, positive values are a SLP (token or baton)
export enum SlpUtxoJudgement {
    "UNKNOWN" = "UNKNOWN", 
    "INVALID_BATON_DAG" = "INVALID_BATON_DAG", 
    "INVALID_TOKEN_DAG" = "INVALID_TOKEN_DAG", 
    "NOT_SLP" = "NOT_SLP", 
    "SLP_TOKEN" = "SLP_TOKEN", 
    "SLP_BATON" = "SLP_BATON",
    "UNSUPPORTED_TYPE" = "UNSUPPORTED_TYPE"
}

export interface SlpTransactionDetails {
    transactionType: SlpTransactionType;
    tokenIdHex: string;
    versionType: SlpVersionType;
    timestamp?: string;
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
    satoshis_in_unknown_token_type: number;
    slpTokenBalances: {[key: string]: BigNumber};
    nftParentChildBalances: {[key: string]: {[key: string]: BigNumber}};
    slpTokenUtxos: {[key: string]: SlpAddressUtxoResult[]};
    slpBatonUtxos: {[key: string]: SlpAddressUtxoResult[]};
    nonSlpUtxos: SlpAddressUtxoResult[];
    invalidTokenUtxos: SlpAddressUtxoResult[];
    invalidBatonUtxos: SlpAddressUtxoResult[];
    unknownTokenTypeUtxos: SlpAddressUtxoResult[];
}

export class SlpAddressUtxoResult {
    txid!: string;
    vout!: number;
    scriptPubKey!: string;
    amount!: number;
    satoshis!: number;
    height!: number;
    confirmations!: number;
    legacyAddress!: string;
    cashAddress!: string;
    wif!: string;
    tx!: TxnDetailsDeep;
    slpTransactionDetails!: SlpTransactionDetails;
    slpUtxoJudgement: SlpUtxoJudgement = SlpUtxoJudgement.UNKNOWN;
    slpUtxoJudgementAmount!: BigNumber;
    nftParentId?: string;
}

export interface utxo {
    txid: string;
    vout: number;
    satoshis: BigNumber;
    wif?: string;
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