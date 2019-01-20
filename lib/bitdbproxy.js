"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const bignumber_js_1 = require("bignumber.js");
const __1 = require("..");
class BitdbProxy {
    constructor(bitdbUrl = 'https://bitdb.bch.sx/q/') {
        this.bitdbUrl = bitdbUrl;
    }
    getTokenInformation(tokenId) {
        return __awaiter(this, void 0, void 0, function* () {
            let query = {
                "v": 3,
                "q": {
                    "find": { "out.h1": "534c5000", "out.s3": "GENESIS", "tx.h": tokenId }
                },
                "r": { "f": "[ .[] | { token_type: .out[0].h2, timestamp: (if .blk? then (.blk.t | strftime(\"%Y-%m-%d %H:%M\")) else null end), symbol: .out[0].s4, name: .out[0].s5, document: .out[0].s6, document_sha256: .out[0].h7, decimals: .out[0].h8, baton: .out[0].h9, quantity: .out[0].h10, URI: \"https://tokengraph.network/token/\\(.tx.h)\" } ]" }
            };
            const data = Buffer.from(JSON.stringify(query)).toString('base64');
            let config = {
                method: 'GET',
                url: this.bitdbUrl + data
            };
            const response = (yield axios_1.default(config)).data;
            const list = [];
            if (response.c) {
                list.push(...response.c);
            }
            if (response.u) {
                list.push(...response.u);
            }
            if (list.length === 0) {
                throw new Error('Token not found');
            }
            let tokenDetails = {
                transactionType: __1.TokenTransactionType.GENESIS,
                tokenId: tokenId,
                type: parseInt(list[0].token_type, 16),
                timestamp: list[0].timestamp,
                symbol: list[0].symbol,
                name: list[0].name,
                documentUri: list[0].document,
                documentSha256: Buffer.from(list[0].document_sha256),
                decimals: parseInt(list[0].decimals, 16) || 0,
                baton: list[0].baton === '02',
                quantity: new bignumber_js_1.default(list[0].quantity, 16).dividedBy(Math.pow(10, (parseInt(list[0].decimals, 16))))
            };
            return tokenDetails;
        });
    }
}
exports.BitdbProxy = BitdbProxy;
