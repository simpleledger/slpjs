// This file will be used to provide missing types from dependencies

export interface BitcoreTxnInput {
    _scriptBuffer: Buffer;
    prevTxId: Buffer;
    outputIndex: number;
    sequenceNumber: number;
}

export interface BitcoreTxnOutput {
    _scriptBuffer: Buffer;
}

export interface BitcoreTransaction {
    inputs: BitcoreTxnInput[]
    outputs: BitcoreTxnOutput[]
}