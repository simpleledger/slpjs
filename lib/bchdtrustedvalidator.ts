import { IGrpcClient } from "grpc-bchrpc";
import { SlpValidator } from "..";

export class BchdValidator implements SlpValidator {
    public client: IGrpcClient;
    constructor(client: IGrpcClient) {
        this.client = client;
    }
    public async getRawTransactions(txid: string[]): Promise<string[]> {
        const res = await this.client.getRawTransaction({hash: txid[0], reversedHashOrder: true});
        return [Buffer.from(res.getTransaction_asU8()).toString("hex")];
    }
    public async isValidSlpTxid(txid: string): Promise<boolean> {
        try {
            console.log(`validate: ${txid}`);
            const res = await this.client.getTrustedSlpValidation({
                txos: [{vout: 1, hash: txid}],
                reversedHashOrder: true
            });
        } catch (error) {
            if (!error.message.includes("Error")) {
                throw error;
            }
            console.log(`false (${txid})`);
            return false;
        }
        console.log(`true (${txid})`);
        return true;
    }

    public async validateSlpTransactions(txids: string[]): Promise<string[]> {
        const res = [];
        for (const txid of txids) {
            res.push((await this.isValidSlpTxid(txid)) ? txid : "");
        }
        return res.filter((id: string) => id.length > 0);
    }
}
