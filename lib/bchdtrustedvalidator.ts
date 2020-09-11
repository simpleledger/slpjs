import { IGrpcClient } from "grpc-bchrpc";
import { logger, SlpValidator } from "..";

export class BchdValidator implements SlpValidator {
    public client: IGrpcClient;
    private logger?: { log: (s: string) => any; };
    constructor(client: IGrpcClient, logger?: logger) {
        this.client = client;
        if (logger) {
            this.logger = logger;
        }
    }
    public async getRawTransactions(txid: string[]): Promise<string[]> {
        const res = await this.client.getRawTransaction({hash: txid[0], reversedHashOrder: true});
        return [Buffer.from(res.getTransaction_asU8()).toString("hex")];
    }
    public async isValidSlpTxid(txid: string): Promise<boolean> {
        try {
            this.log(`validate: ${txid}`);
            const res = await this.client.getTrustedSlpValidation({
                txos: [{vout: 1, hash: txid}],
                reversedHashOrder: true
            });
        } catch (error) {
            if (! error.message.includes("txid is missing from slp validity set")) {
                throw error;
            }
            this.log(`false (${txid})`);
            return false;
        }
        this.log(`true (${txid})`);
        return true;
    }

    public async validateSlpTransactions(txids: string[]): Promise<string[]> {
        const res = [];
        for (const txid of txids) {
            res.push((await this.isValidSlpTxid(txid)) ? txid : "");
        }
        return res.filter((id: string) => id.length > 0);
    }

    private log(s: string) {
        if (this.logger) {
            this.logger.log(s);
        }
    }
}
