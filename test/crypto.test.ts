import { Crypto } from "../lib/crypto";
import assert from "assert";

describe('Crypto', () => {
    describe('txid()', () => {
        it('Transaction hash computes properly', () => {
            let txn = Buffer.from("010000000195e0023eb5592ca1ddf53c5faa3b996d77e858c9c6fc6463805c447e4c4e815b010000006a473044022005f782e7e3f5b3ec1b244f1dc2d579bee762978d17d32a1b8c9e4bc7d99254eb02202cf1ea85affb4873b6e673116f56d8c94069cdb36ec9f30f93a9cf68be962b18412103363471f8c0366aa48519defbd59b1744b22e4a096d15001c2860c84e8454bc75feffffff025a433000000000001976a914e2f118495cb33222ccbafc5cf7ddc69357fc982088acc07dbb0b000000001976a9140e8f40ab1a164ba2a45e28d2b73f8d9047a8d2b988acc2910900", "hex");
            let expectedTxid = "34e3d749803e0b14e41a2c8df559eed10e82898c5382563a3bbb9cc1fe3ee12d";
            let txid = Crypto.txid(txn).toString("hex");
            assert.equal(txid, expectedTxid);
        });
    });
});
