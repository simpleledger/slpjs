export interface SlpValidityUnitTest {
    description: string;
    when: SlpTestTxn[]
    should: SlpTestTxn[]
}

export interface SlpTestTxn {
    tx: string, valid: boolean
}