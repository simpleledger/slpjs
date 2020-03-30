import { logger } from "../index";
import { SlpValidator } from "./slp";

import axios, { AxiosRequestConfig } from "axios";
import { Crypto } from "./crypto";

interface Validation { validity: boolean|null; invalidReason: string|null; tokenIdHex?: string; tokenTypeHex?: number; }

export class TrustedValidator implements SlpValidator {
    public cachedValidations: { [txid: string]: Validation };
    public logger: logger = { log: (s: string) => null };
    public slpdbUrl: string;

    constructor({slpdbUrl= "https://slpdb.fountainhead.cash", logger}: { slpdbUrl?: string; logger?: logger; }) {
        if (logger) {
            this.logger = logger;
        }
        this.slpdbUrl = slpdbUrl;
        this.cachedValidations = {};
    }

    public addValidationFromStore(hex: string, isValid: boolean, tokenIdHex?: string, tokenTypeHex?: number) {
        const id = Crypto.txid(Buffer.from(hex, "hex")).toString("hex");
        if (!this.cachedValidations[id]) {
            this.cachedValidations[id] = { validity: isValid, invalidReason: null, tokenIdHex, tokenTypeHex };
        }
    }

    public async isValidSlpTxid(txid: string, tokenIdFilter?: string, tokenTypeFilter?: number): Promise<boolean> {
        this.logger.log("SLPJS Validating (via SLPDB): " + txid);
        const valid = await this._isValidSlpTxid(txid, tokenIdFilter, tokenTypeFilter);
        this.logger.log("SLPJS Result (via SLPDB): " + valid + " (" + txid + ")");
        if (!valid && this.cachedValidations[txid].invalidReason) {
            this.logger.log("SLPJS Invalid Reason (via SLPDB): " + this.cachedValidations[txid].invalidReason);
        } else if (!valid) {
            this.logger.log("SLPJS Invalid Reason (via SLPDB): unknown (result is user supplied)");
        }
        return valid;
    }

    public async validateSlpTransactions(txids: string[]): Promise<string[]> {
        const res = [];
        for (const txid of txids) {
            res.push((await this.isValidSlpTxid(txid)) ? txid : "");
        }
        return res.filter((id: string) => id.length > 0);
    }

    private async _isValidSlpTxid(txid: string, tokenIdFilter?: string, tokenTypeFilter?: number): Promise<boolean> {
        if (this.cachedValidations[txid]) {
            if (tokenIdFilter && tokenIdFilter !== this.cachedValidations[txid].tokenIdHex) {
                this.cachedValidations[txid].invalidReason = "Incorrect tokenIdFilter";
                return false;
            } else if (tokenTypeFilter && tokenTypeFilter !== this.cachedValidations[txid].tokenTypeHex) {
                this.cachedValidations[txid].invalidReason = "Incorrect tokenTypeFilter";
                return false;
            } else if (typeof this.cachedValidations[txid] === "boolean") {
                return this.cachedValidations[txid].validity!;
            } else {
                throw Error("Validation cache is corrupt.");
            }
        }

        // todo abstract this
        const q = {
            v: 3,
            q: {
                db: ["c", "u"],
                aggregate: [
                    { $match: { "tx.h": txid }},
                    { $project: { validity: "$slp.valid", invalidReason: "$slp.invalidReason", tokenTypeHex: "$slp.detail.versionType", tokenIdHex: "$slp.detail.tokenIdHex" }},
                ],
                limit: 1,
            },
        };
        const data = Buffer.from(JSON.stringify(q)).toString("base64");
        const config: AxiosRequestConfig = {
            method: "GET",
            url: this.slpdbUrl + "/q/" + data,
        };
        const response: { c: Validation[], u: Validation[] } = (await axios(config)).data;
        let result!: Validation;
        if (response.c.length > 0) {
            result = response.c[0];
        } else if (response.u.length > 0) {
            result = response.u[0];
        } else {
            result = { validity: false, invalidReason: "Transaction not found in SLPDB." };
        }
        if (result) {
            this.cachedValidations[txid] = result;
        }
        return result.validity!;
    }
}
