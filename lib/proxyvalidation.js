const axios = require('axios');

module.exports = class ProxyValidation {
    constructor(proxyUrl='https://validate.simpleledger.info') {
        this.proxyUrl = proxyUrl;
    }

    async validateSlpTransaction(txid) {
        const result = await axios({
            method: "post",
            url: this.proxyUrl,
            data: {
                jsonrpc: "2.0",
                id: "slpvalidate",
                method: "slpvalidate",
                params: [txid, false, false]
            }
        });
        if (result && result.data && result.data.result === "Valid") {
            return true
        } else {
            return false
        }
    }
}