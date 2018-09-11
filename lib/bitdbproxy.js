const axios = require('axios');

const bitDbUrl      = 'https://bitdb.network/q/'
    , tokenGraphUrl = 'https://tokengraph.network/verify/';

module.exports = class BitbdProxy {
    static async getTokenInformation(tokenId, apiKey) {

        if(!apiKey)
            throw new Error('Missing BitDB key');

        let query = {
            request: {
                find: {
                    s3: 'GENESIS',
                    tx: tokenId,
                }, 
                project: {
                    b5:  1,
                    b8:  1,
                    _id: 0,
                }
            },
            response: {
                encoding: {
                    b5: 'utf8',
                    b8: 'hex'
                }
            }
        };
        const data = Buffer.from(JSON.stringify(query)).toString('base64');
    
        const response = (await axios({
            method: 'GET',
            url: bitDbUrl + data,
            headers: {
                'key': apiKey,
            },
            json: true,
        })).data;
    
        if(response.status === 'error'){
            throw new Error(response.message || 'API error message missing');
        }
    
        const list = [];
        if(response.confirmed){
            list.push(...response.confirmed);
        }
        if(response.unconfirmed){
            list.push(...response.unconfirmed);
        }
        if(list.length === 0){
            throw new Error('Token not found');
        }
    
        let tokenName, tokenPrecision;
        tokenName      = list[0].b5 || null;
        tokenPrecision = parseInt(list[0].b8, 16) || 0;
    
        return { tokenName, tokenPrecision };
    }

    static async verifyTransactions(txIds = []) {
        if(txIds.length === 0)
            return [];

        const response = await axios({
            method: 'GET',
            url: tokenGraphUrl + txIds.join(','),
            json: true,
        });

        return response.data.response.filter(i => !i.errors).map(i => i.tx);
    }
}
