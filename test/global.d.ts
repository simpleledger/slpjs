export interface SlpValidityUnitTest {
    description: string;
    when: SlpTestTxn[];
    should: SlpTestTxn[];
    allow_inconclusive: boolean;
    inconclusive_reason: string;
}

export interface SlpTestTxn {
    tx: string;
    valid: boolean;
}