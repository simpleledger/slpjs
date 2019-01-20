import BigNumber from "bignumber.js";
import { AddressUtxoResult } from "bitbox-sdk/typings/Address";

export enum TokenTransactionType {
    "GENESIS", "MINT", "SEND"
}

export enum TokenType {
    "TokenType1" = 1
}

export interface TokenTransactionDetails {
    transactionType: TokenTransactionType;
    tokenId: string;
    type: TokenType;
    timestamp: string;
    symbol: string;
    name: string;
    documentUri: string; 
    documentSha256: Buffer;
    decimals: number;
    baton: boolean;
    quantity: BigNumber;
}

export interface TokenSendDetails {
    quantity: BigNumber;
}

export interface TokenBalancesResult {
    satoshis_available: number;
    satoshis_locked_in_minting_baton: number;
    satoshis_locked_in_token: number;
}

export interface AddressUtxoResultExtended extends AddressUtxoResult {
    tx: any;
    baton: boolean;
    slp: any;
}

const slp = require('./lib/slp')
    , utils = require('./lib/utils')
    , bitdbproxy = require('./lib/bitdbproxy')
    , validation = require('./lib/proxyvalidation')
    , bitbox = require('./lib/bitboxnetwork');

export const slpjs = {
    slp: slp,
    utils: utils,
    bitbox: bitbox, 
    bitdb: bitdbproxy, 
    validation: validation
}