
declare module "bchaddrjs-slp" {
    export function isCashAddress(address: string): boolean;
    export function toCashAddress(address: string): string;
    export function isLegacyAddress(address: string): boolean;
    export function toLegacyAddress(address: string): string;
    export function isSlpAddress(address: string): boolean;
    export function toSlpAddress(address: string): string;
    export function toSlpRegtestAddress(address: string): string;
    export function toRegtestAddress(address: string): string;
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
    // Type definitions for bitcore-lib 0.15
    // Project: https://github.com/bitpay/bitcore-lib
    // Definitions by: Lautaro Dragan <https://github.com/lautarodragan>
    // Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

    // TypeScript Version: 2.2

    /// <reference types="node" />

    export namespace crypto {
        class BN {
            static fromNumber(input_satoshis: number): any;
        }
        namespace ECDSA {
            function sign(message: Buffer, key: PrivateKey): Signature;
            function verify(hashbuf: Buffer, sig: Signature, pubkey: PublicKey, endian?: 'little'): boolean;
        }
        namespace Hash {
            function sha256(buffer: Buffer): Uint8Array;
        }
        namespace Random {
        function getRandomBuffer(size: number): Buffer;
        }
        namespace Point {}
        class Signature {
            static fromDER(sig: Buffer): Signature;
            static fromString(data: string): Signature;
            SIGHASH_ALL: number;
            toString(): string;
        }
    }

    export class Transaction {
        inputs: Input[];
        outputs: Output[];
        toObject(): any;
        toBuffer(): Buffer;
        readonly id: string;
        readonly hash: string;
        nid: string;
        static Output: any;
        static Input: any;
        static Sighash: any;

        constructor(serialized?: any);

        from(utxos: Transaction.UnspentOutput[]): Transaction;
        to(address: Address | string, amount: number): Transaction;
        change(address: Address | string): Transaction;
        sign(privateKey: PrivateKey | string): Transaction;
        applySignature(sig: crypto.Signature): Transaction;
        addData(data: Buffer): this;
        serialize(): string;
    }

    export namespace Transaction {
        class UnspentOutput {
            static fromObject(o: object): UnspentOutput;

            readonly address: Address;
            readonly txId: string;
            readonly outputIndex: number;
            readonly script: Script;
            readonly satoshis: number;

            constructor(data: object);

            inspect(): string;
            toObject(): this;
            toString(): string;
            toBuffer(): Buffer;
        }
    }

    export class Block {
        hash: string;
        height: number;
        transactions: Transaction[];
        header: {
            time: number;
            prevHash: string;
        };

        constructor(data: Buffer | object);
    }

    export class PrivateKey {
        readonly publicKey: PublicKey;

        constructor(key: string);
    }

    export class PublicKey {
        constructor(source: string);

        static fromPrivateKey(privateKey: PrivateKey): PublicKey;

        toBuffer(): Buffer;
        toDER(): Buffer;
    }

    export interface Output {
        satoshis: number;
        _scriptBuffer: Buffer;
        readonly script: any;
    }

    export namespace Script {
        const types: {
            DATA_OUT: string;
        };
        function buildPublicKeyHashOut(address: Address): Script;
    }

    export class Script {
        static fromAddress(address: Address|string): Script;
        constructor(script: Buffer);
        fromBuffer(buffer: Buffer): Script;
        toBuffer(): Buffer;
        toAddress(network: any): Address;
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

    export interface Util {
        readonly buffer: {
            reverse(a: any): any;
        };
    }

    export namespace Networks {
        interface Network {
            readonly name: string;
            readonly alias: string;
        }

        const livenet: Network;
        const mainnet: Network;
        const testnet: Network;

        function add(data: any): Network;
        function remove(network: Network): void;
        function get(args: string | number | Network, keys: string | string[]): Network;
    }

    export class Address {
        toString(fmt?: string): string;
    }

    export class Input {
        output: any;
        prevTxId: any;
        script: Script;
        outputIndex: number;
        getSignatures(txn: Transaction, privateKey: PrivateKey, input_index: number, sigHashType: number): any;
        setScript(script: Script): void;
        _scriptBuffer: Buffer;
    }
}

//     export interface TxnInput {
//         redeemScript: any;
//         output: any;
//         script: Script;
//         _scriptBuffer: Buffer;
//         prevTxId: Buffer;
//         outputIndex: number;
//         sequenceNumber: number;
//         setScript(script: Script): void;
//         getSignatures(transaction: Transaction, privKey: PrivateKey, index: number, sigtype?: number, hashData?: Buffer): any;
//     }

//     export interface Script {
//         fromBuffer(buffer: Buffer): Script;
//         toBuffer(): Buffer;
//         toAddress(network: any): Address;
//         fromAddress(address: Address): Script;
//         fromString(hex: string): Script;
//         fromASM(asm: string): string;
//         toASM(): string;
//         fromHex(hex: string): string
//         toHex(): string;
//         chunks: Chunk[];
//     }

//     export interface Chunk {
//         buf: Buffer;
//         len: number;
//         opcodenum: number;
//     }
    
//     export interface TxnOutput {
//         _scriptBuffer: Buffer;
//         script: Script;
//         satoshis: number;
//     }

//     export class crypto {
//         static BN: any;
//     }

//     export class Transaction {
//         inputs: Input[];
//         outputs: Output[];
//         readonly id: string;
//         readonly hash: string;
//         nid: string;
    
//         constructor(serialized?: any);
    
//         from(utxos: Transaction.UnspentOutput[]): Transaction;
//         to(address: Address | string, amount: number): Transaction;
//         change(address: Address | string): Transaction;
//         sign(privateKey: PrivateKey | string): Transaction;
//         applySignature(sig: crypto.Signature): Transaction;
//         addData(data: Buffer): this;
//         serialize(): string;
//     }

//     export class PrivateKey {
//         constructor(key: string);
//     }

//     export class Script {
//         static fromAddress(arg0: any): any;
//         constructor(script: Buffer);
//     }

//     export interface Transaction {
//         inputs: TxnInput[];
//         outputs: TxnOutput[];
//         toObject(): any;
//         serialize(unsafe?: boolean): string;
//         sign(key: PrivateKey): Promise<string|Buffer>;
//         hash: string;
//         id: string;
//     }

//     export interface Networks {
//         livenet: any;
//     }

//     export interface Address {
//         toString(format: string): string;
//     }
// }
