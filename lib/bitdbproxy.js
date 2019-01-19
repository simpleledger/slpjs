const axios = require('axios');

module.exports = class BitdbProxy {

    constructor(bitdbUrl='https://bitdb.bch.sx/q/'){
        this.bitdbUrl = bitdbUrl;
    }

    async getTokenInformation(tokenId) {

        let query = {
            "v": 3,
            "q": {
                "find": { "out.h1": "534c5000", "out.s3": "GENESIS", "tx.h": tokenId }
            },
            "r": { "f": "[ .[] | { timestamp: (if .blk? then (.blk.t | strftime(\"%Y-%m-%d %H:%M\")) else null end), symbol: .out[0].s4, name: .out[0].s5, document: .out[0].s6, document_sha256: .out[0].h7, decimals: .out[0].h8, baton: .out[0].h9, quantity: .out[0].h10, URI: \"https://tokengraph.network/token/\\(.tx.h)\" } ]" }
        }
        
        const data = Buffer.from(JSON.stringify(query)).toString('base64');

        const response = (await axios({
            method: 'GET',
            url: this.bitdbUrl + data,
            json: true,
        })).data;
    
        const list = [];
        if(response.c){
            list.push(...response.c);
        }
        if(response.u){
            list.push(...response.u);
        }
        if(list.length === 0){
            throw new Error('Token not found');
        }
    
        let tokenDetails = {
            timestamp: list[0].timestamp,
            symbol: list[0].symbol,
            name: list[0].name,
            token_document_uri: list[0].document,
            token_document_sha256: list[0].document_sha256 || null,
            decimals: parseInt(list[0].decimals, 16) || 0,
            baton: list[0].baton === '02',
            quantity: parseInt(list[0].quantity, 16) /  10**(parseInt(list[0].decimals, 16))
        }

        return tokenDetails;
    }
}
