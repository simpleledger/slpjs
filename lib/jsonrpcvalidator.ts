import BITBOX from 'bitbox-sdk/typings/bitbox-sdk';
import axios from 'axios';

import { Slp, SlpProxyValidator } from './slp';
import { SlpAddressUtxoResult } from './slpjs';

export class JsonRpcProxyValidator implements SlpProxyValidator {
    validatorUrl: string;
    slp: Slp;
    constructor(BITBOX: BITBOX, validatorUrl) {
        this.validatorUrl = validatorUrl;
        this.slp = new Slp(BITBOX);
    }

    async isValidSlpTxid(txid: string) {
        let data = {
            jsonrpc: "2.0",
            id: "slpvalidate",
            method: "slpvalidate",
            params: [ txid, false, false ]
        }
        const result = await axios({
            method: "post",
            url: this.validatorUrl,
            data: data
        });
        if (result && result.data && result.data.result === "Valid") {
            return true
        } else {
            return false
        }
    }
    
    async validateSlpTransactions(txids: string[]) {
        // Validate each txid
	    const validatePromises = txids.map(async (txid) => {
            const isValid = await this.isValidSlpTxid(txid)
            return isValid ? txid : '';
        })
      
        // Filter array to only valid txid results
        const validateResults = await axios.all(validatePromises)
        return validateResults.filter((result) => result.length > 0);
    }

    async processUtxosForSlp(utxos: SlpAddressUtxoResult[], validatorOverride?: SlpProxyValidator) {
        if(validatorOverride)
            throw Error('Cannot override validator for JsonRpcProxyValidator.')
        return await this.slp.processUtxosForSlpAbstract(utxos, this)
    }
}