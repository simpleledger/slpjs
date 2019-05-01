declare module "bchaddrjs-slp" {
    export function isCashAddress(address: string): boolean;
    export function toCashAddress(address: string): string;
    export function isLegacyAddress(address: string): boolean;
    export function toLegacyAddress(address: string): string;
    export function isSlpAddress(address: string): boolean;
    export function toSlpAddress(address: string): string;
    export function decodeAddress(address: string): AddressDetails;
    export function encodeAsSlpaddr(decoded: AddressDetails): string;

    export interface AddressDetails {
        hash: Uint8Array;
        format: string;
        network: string;
        type: string;
    }
}

declare module "bitcore-lib-cash" {
    export interface TxnInput {
        script: Script;
        _scriptBuffer: Buffer;
        prevTxId: Buffer;
        outputIndex: number;
        sequenceNumber: number;
    }

    export interface Script {
        fromBuffer(buffer: Buffer): Script;
        toBuffer(): Buffer;
        toAddress(network: any): Address;
        fromAddress(address: Address): Script;
        fromString(hex: string): Script;
        fromASM(asm: string): string;
        toASM(): string;
        fromHex(hex: string): string
        toHex(): string;
        chunks: Chunk[];
    }

    export interface Chunk {
        buf: Buffer;
        len: number;
        opcodenum: number;
    }
    
    export interface TxnOutput {
        _scriptBuffer: Buffer;
        script: Script;
        satoshis: number;
    }

    export class Transaction implements Transaction {
        constructor(txhex: string);
        constructor();
    }
    export interface Transaction {
        inputs: TxnInput[];
        outputs: TxnOutput[];
        toObject(): any;
        serialize(unsafe?: boolean): string
        hash: string;
        id: string;
    }

    export interface Networks {
        livenet: any;
    }

    export interface Address {
        toString(format: string): string;
    }
}
