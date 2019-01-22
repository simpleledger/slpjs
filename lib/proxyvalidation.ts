import BITBOX from '../node_modules/bitbox-sdk/typings/bitbox-sdk';
import axios from 'axios';
import BigNumber from 'bignumber.js';

import { Slp } from './slp';
import { SlpAddressUtxoResult, SlpTransactionType, SlpUtxoJudgement, SlpBalancesResult } from './slpjs';

export class ProxyValidation {
    proxyUrl: string;
    slp: Slp;
    constructor(BITBOX: BITBOX, proxyUrl='https://validate.simpleledger.info') {
        this.proxyUrl = proxyUrl;
        this.slp = new Slp(BITBOX);
    }

    async isValidSlpTxid(txid: string) {
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

    async validateTransactions(txIds: string[]) {

        // Validate each txid
	    const validatePromises = txIds.map(async (txid) => {
            const isValid = await this.isValidSlpTxid(txid)
            return isValid ? txid : '';
          })
      
        // Filter array to only valid txid results
        const validateResults = await axios.all(validatePromises)
        return validateResults.filter((result) => result.length > 0);
    }

    async processUtxosForSlp(utxos: SlpAddressUtxoResult[]) {

        // 1) parse SLP OP_RETURN and cast initial SLP judgement, based on OP_RETURN only.
        for(let txo of utxos) {
            try {
                let vout = txo.tx.vout.find(vout => vout.n === 0);
                if(!vout)
                    throw 'Utxo contains no Vout!';
                let vout0script = Buffer.from(vout.scriptPubKey.hex, 'hex');
                txo.slpTokenDetails = this.slp.parseSlpOutputScript(vout0script);

                // populate txid for GENESIS
                if(txo.slpTokenDetails.transactionType === SlpTransactionType.GENESIS)
                    txo.slpTokenDetails.tokenIdHex = txo.txid;

                // apply initial SLP judgement to the UTXO (based on OP_RETURN parsing ONLY! Still need to validate the DAG for possible tokens and batons!)
                if(txo.slpTokenDetails.transactionType === SlpTransactionType.GENESIS ||
                    txo.slpTokenDetails.transactionType === SlpTransactionType.MINT) {
                    if (txo.slpTokenDetails.containsBaton && txo.slpTokenDetails.batonVout === txo.vout)
                        txo.slpJudgement = SlpUtxoJudgement.SLP_BATON;
                    else if(txo.vout === 1)
                        txo.slpJudgement = SlpUtxoJudgement.SLP_TOKEN;
                    else
                        txo.slpJudgement = SlpUtxoJudgement.NOT_SLP;
                } else if(txo.slpTokenDetails.transactionType === SlpTransactionType.SEND && txo.slpTokenDetails.sendOutputs) {
                    if(txo.vout > 0 && txo.vout < txo.slpTokenDetails.sendOutputs.length)
                        txo.slpJudgement = SlpUtxoJudgement.SLP_TOKEN;
                    else 
                        txo.slpJudgement = SlpUtxoJudgement.NOT_SLP;
                }
            } catch(e) {
                // any errors in parsing SLP OP_RETURN means the TXN is NOT SLP.
                txo.slpJudgement = SlpUtxoJudgement.NOT_SLP;
            }

            if(txo.slpJudgement === SlpUtxoJudgement.UNKNOWN || txo.slpJudgement === undefined)
                throw Error('Utxo SLP judgement has not been set, unknown error.')
        }

        // 2) Get list of txids with valid SLP DAGs - create distinct Set() txids from initial OP_RETURN judgements
        let validSLPTx: string[] = await this.validateTransactions([
            ...new Set(utxos.filter(txOut => {
                if(txOut.slpTokenDetails && 
                    txOut.slpJudgement !== SlpUtxoJudgement.UNKNOWN && 
                    txOut.slpJudgement !== SlpUtxoJudgement.NOT_SLP)
                    return true;
                return false;
            }).map(txOut => txOut.txid))
        ]);

        // 3) Update initial judgements with results received from the proxy DAG validator
        utxos.forEach(utxo => {
            if(utxo.txid !in validSLPTx) {
                if(utxo.slpJudgement === SlpUtxoJudgement.SLP_TOKEN || utxo.slpJudgement === SlpUtxoJudgement.SLP_BATON)
                    utxo.slpJudgement = SlpUtxoJudgement.INVALID_DAG;
            }
        });

        // 4) Prepare results object
        const result: SlpBalancesResult = {
            satoshis_available_bch_not_slp: 0,
            satoshis_in_slp_minting_baton: 0,
            satoshis_in_slp_token: 0,
            slpTokenBalances: {},
            slpTokenUtxos: [],
            slpBatonUtxos: [],
            nonSlpUtxos: []
        };

        // 5) Loop through UTXO set and accumulate balances for type of utxo, organize the Utxos into their categories.
        for (const txo of utxos) {
            if(txo.slpJudgement === SlpUtxoJudgement.SLP_TOKEN) {
                if (!(txo.slpTokenDetails.tokenIdHex in result.slpTokenBalances))
                    result.slpTokenBalances[txo.slpTokenDetails.tokenIdHex] = new BigNumber(0);
                if(txo.slpTokenDetails.transactionType === SlpTransactionType.GENESIS || txo.slpTokenDetails.transactionType === SlpTransactionType.MINT){
                    result.slpTokenBalances[txo.slpTokenDetails.tokenIdHex] = result.slpTokenBalances[txo.slpTokenDetails.tokenIdHex].plus(<BigNumber>txo.slpTokenDetails.genesisOrMintQuantity);
                } else if(txo.slpTokenDetails.transactionType === SlpTransactionType.SEND && txo.slpTokenDetails.sendOutputs) {
                    let qty = txo.slpTokenDetails.sendOutputs[txo.vout];
                    result.slpTokenBalances[txo.slpTokenDetails.tokenIdHex] = result.slpTokenBalances[txo.slpTokenDetails.tokenIdHex].plus(qty);
                } else {
                    throw Error('Unknown Error: cannot have an SLP_TOKEN that is not from GENESIS, MINT, or SEND.')
                }
                result.satoshis_in_slp_token += txo.satoshis;
                result.slpTokenUtxos.push(txo);
            } else if (txo.slpJudgement === SlpUtxoJudgement.SLP_BATON) {
                result.satoshis_in_slp_minting_baton += txo.satoshis;
                result.slpBatonUtxos.push(txo);
            } else {
                result.satoshis_available_bch_not_slp += txo.satoshis;
                result.nonSlpUtxos.push(txo);
            }
        }

        if(utxos.length < (result.slpBatonUtxos.length + result.nonSlpUtxos.length + result.slpTokenUtxos.length))
            throw Error('Not all UTXOs have been categorized. Unknown Error.');

        return result;
    }
}