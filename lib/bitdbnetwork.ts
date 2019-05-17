import { SlpTransactionDetails, SlpTransactionType } from '../index';

import axios, { AxiosRequestConfig } from 'axios';
import BigNumber from 'bignumber.js';

export class BitdbNetwork {
    bitdbUrl: string;

    constructor(bitdbUrl='https://bitdb.bch.sx/q/'){
        this.bitdbUrl = bitdbUrl;
    }

    async getTokenInformation(tokenId: string): Promise<SlpTransactionDetails|{ error: string }> {

        let query = {
            "v": 3,
            "q": {
                "find": { "out.h1": "534c5000", "out.s3": "GENESIS", "tx.h": tokenId }
            },
            "r": { "f": "[ .[] | { token_type: .out[0].h2, timestamp: (if .blk? then (.blk.t | strftime(\"%Y-%m-%d %H:%M\")) else null end), symbol: .out[0].s4, name: .out[0].s5, document: .out[0].s6, document_sha256: .out[0].h7, decimals: .out[0].h8, baton: .out[0].h9, quantity: .out[0].h10, URI: \"https://tokengraph.network/token/\\(.tx.h)\" } ]" }
        }
        
        const data = Buffer.from(JSON.stringify(query)).toString('base64');

        let config: AxiosRequestConfig = {
            method: 'GET',
            url: this.bitdbUrl + data
        };

        const response = (await axios(config)).data;

        const list = [];
        if(response.c){
            list.push(...response.c);
        }
        if(response.u){
            list.push(...response.u);
        }
        if(list.length === 0) {
            throw new Error('Token not found');
        }

        let tokenDetails: SlpTransactionDetails = {
            transactionType: SlpTransactionType.GENESIS,
            tokenIdHex: tokenId, 
            versionType: parseInt(list[0].token_type, 16),
            timestamp: list[0].timestamp,
            symbol: list[0].symbol,
            name: list[0].name,
            documentUri: list[0].document,
            documentSha256: list[0].document_sha256 ? Buffer.from(list[0].document_sha256) : null,
            decimals: parseInt(list[0].decimals, 16) || 0,
            containsBaton: Buffer.from(list[0].baton,'hex').readUIntBE(0,1) >= 2,
            batonVout: Buffer.from(list[0].baton,'hex').readUIntBE(0,1),
            genesisOrMintQuantity: new BigNumber(list[0].quantity, 16).dividedBy(10**(parseInt(list[0].decimals, 16)))
        }

        return tokenDetails;
    }
}