let BITBOXCli = require('bitbox-cli/lib/bitbox-cli').default;
let BITBOX = new BITBOXCli();

let bchaddr = require('bchaddrjs-slp');
let _  = require('lodash');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

module.exports = class BitboxNetwork {
    static async getUtxo(address) {
        // must be a cash or legacy addr
        if(!bchaddr.isCashAddress(address) && !bchaddr.isLegacyAddress(address)) 
            throw new Error("Not an a valid address format, must be cashAddr or Legacy address format.");
        let res = await BITBOX.Address.utxo(address);
        return res;
    }

    static async getUtxoWithRetry(address, retries = 40){
		let result;
		let count = 0;
		while(result == undefined){
			result = await this.getUtxo(address)
			count++;
			if(count > retries)
				throw new Error("BITBOX.Address.utxo endpoint experienced a problem");
			await sleep(250);
		}
		return result;
    }

    static async getUtxoWithTxDetails(address){
        const set = await this.getUtxoWithRetry(address);
        let txIds = set.map(i => i.txid)
    
        if(txIds.length === 0){
            return [];
        }
    
        // Split txIds into chunks of 20 (BitBox limit), run the detail queries in parallel
        let txDetails = await Promise.all(_.chunk(txIds, 20).map(txIdchunk => {
            return this.getTransactionDetailsWithRetry(txIdchunk);
        }));
    
        // concat the chunked arrays
        txDetails = [].concat(...txDetails);
    
        for(let i = 0; i < set.length; i++){
            set[i].tx = txDetails[i];
        }
    
        return set;
    }
    
    static async getTransactionDetailsWithRetry(txid, retries = 40){
        let result;
        let count = 0;
        while(result == undefined){
            result = await BITBOX.Transaction.details(txid);
            count++;
            if(count > retries)
                throw new Error("BITBOX.Address.details endpoint experienced a problem");

            await sleep(250);
        }
        return result; 
    }

	static async getAddressDetailsWithRetry(address, retries = 40){
        // must be a cash or legacy addr
        if(!bchaddr.isCashAddress(address) && !bchaddr.isLegacyAddress(address)) 
            throw new Error("Not an a valid address format, must be cashAddr or Legacy address format.");
		let result;
		let count = 0;
		while(result == undefined){
			result = await BITBOX.Address.details(address);
			count++;
			if(count > retries)
				throw new Error("BITBOX.Address.details endpoint experienced a problem");

			await sleep(250);
		}
		return result;
	}

    static async sendTx(hex) {
        let res = await BITBOX.RawTransactions.sendRawTransaction(hex);
        console.log(res);
        return res;
    }

    static async monitorForPayment(paymentAddress, fee, onPaymentCB) {
        // must be a cash or legacy addr
        if(!bchaddr.isCashAddress(paymentAddress) && !bchaddr.isLegacyAddress(paymentAddress)) 
            throw new Error("Not an a valid address format, must be cashAddr or Legacy address format.");
        
        while (true) {
            try {
                let utxo = (await this.getUtxo(paymentAddress))[0]
                if (utxo && utxo.satoshis >= fee) {
                    break
                }
            } catch (ex) {
                console.log(ex)
            }
            await sleep(5000)
        }
        onPaymentCB()
    }
}