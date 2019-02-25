import BITBOXSDK from 'bitbox-sdk/lib/bitbox-sdk';
import { SlpAddressUtxoResult, Utils, SlpTransactionDetails, utxo, SlpUtxoJudgement } from '..';
import { Slp, configBuildSendOpReturn, configBuildRawSendTx } from './slp';
import BigNumber from 'bignumber.js';
import * as Bitcore from 'bitcore-lib-cash';

const dummyTxid = '11'.repeat(32);
const dummyScriptPubKey = Buffer.from('00', 'hex');

interface SlpTokenOffer {
    label: string|null;
    isSpent: boolean;
    op_return: string;
    dummyHex: string;
    scriptSig: Buffer;
    token: { 
        lockedSatoshis: number, 
        qty: BigNumber, 
        priceSatoshis: number, 
        txid: string, 
        vout: number, 
        details: SlpTransactionDetails 
    };
    paymentAddress: string;
}

interface SlpTokenTrade {
    label: string|null;
    isComplete: boolean;
    txHex: string;
    originalOffer: SlpTokenOffer;
}

export class SlpTradeManager {

    BITBOX: BITBOXSDK;
    slp: Slp;
    private trades: Map<string, SlpTokenTrade>;

    constructor(BITBOX: BITBOXSDK) {
        this.BITBOX = BITBOX;
        this.slp = new Slp(this.BITBOX);
        this.trades = new Map<string, SlpTokenTrade>();
    }

    private addNewTrade(txid: string, vout: number, trade: SlpTokenTrade) {
        if(!this.trades.has(txid + vout.toString()))
            this.trades.set(txid + vout, trade);
        else
            throw Error("A trade for this token already exists")
    }

    private updateTrade(trade: SlpTokenTrade) {
        let txid = trade.originalOffer.token.txid
        let vout = trade.originalOffer.token.vout.toString()
        this.trades.set(txid + vout, trade);
    }

    createSlpForBchOffer(utxo: SlpAddressUtxoResult, priceSatosis: number, paymentAddress: string, label?: string): SlpTokenOffer {
        // Seller creates a partially aigned transaction using SINGLE|ANYONECANPAY
        // -----------------------------------------------------
        // inputs                    |  outputs
        // --------------------------|--------------------------
        //  dummy                    |  empty (TO BE REPLACED WITH SLP MSG)
        //  dummy                    |  empty
        //  Seller Signed SLP input  |  Seller Signed BCH output

        let tb = new this.BITBOX.TransactionBuilder(Utils.txnBuilderString(paymentAddress));
        tb.addInput(dummyTxid, 0);
        tb.addInput(dummyTxid, 1);
        tb.addInput(utxo.txid, utxo.vout);
        tb.addOutput(dummyScriptPubKey, 0);
        tb.addOutput(dummyScriptPubKey, 0);
        tb.addOutput(Utils.toCashAddress(paymentAddress), priceSatosis);
        tb.sign(0, this.BITBOX.ECPair.fromWIF(utxo.wif), undefined, tb.hashTypes.SIGHASH_ALL, 0);
        tb.sign(1, this.BITBOX.ECPair.fromWIF(utxo.wif), undefined, tb.hashTypes.SIGHASH_ALL, 0);
        tb.sign(2, this.BITBOX.ECPair.fromWIF(utxo.wif), undefined, tb.hashTypes.SIGHASH_SINGLE | tb.hashTypes.SIGHASH_ANYONECANPAY | tb.hashTypes.SIGHASH_BITCOINCASH_BIP143, priceSatosis);
        console.log(tb);
        let tx = tb.transaction.build();
        
        //let txn = new Bitcore.Transaction(tx.toHex());

        let config: configBuildSendOpReturn = {
            tokenIdHex: utxo.slpTransactionDetails.tokenIdHex, 
            outputQtyArray: [ utxo.slpUtxoJudgementAmount ]
        }

        let script = this.slp.buildSendOpReturn(config);
        console.log(tx.ins[2]);
        let offer: SlpTokenOffer = {
            label: label ? label : null, 
            isSpent: false,
            op_return: script.toString('hex'), 
            dummyHex: tx.toHex(), 
            scriptSig: tx.ins[2].script,
            token: { 
                lockedSatoshis: utxo.satoshis,
                qty: utxo.slpUtxoJudgementAmount,
                priceSatoshis: priceSatosis, 
                txid: utxo.txid, 
                vout: utxo.vout,
                details: utxo.slpTransactionDetails
            }, 
            paymentAddress: paymentAddress 
        };

        let trade = {
            label: "",
            isComplete: false,
            txHex: "",
            originalOffer: offer
        }

        this.addNewTrade(utxo.txid, utxo.vout, trade)

        return offer;
    }

    createSlpForBchPurchase(tokenOffer: SlpTokenOffer, buyerPaymentUtxos: SlpAddressUtxoResult[], tokenClaimAddress: string, buyerFillerUtxos: SlpAddressUtxoResult[]) {
        // Buyer completes the parially signed transaction
        // ----------------------------------------------------------- 
        // inputs                                |  outputs
        // --------------------------------------|--------------------
        //  Buyer filler (allow a token burn)    |  SLP OP_RETURN
        //  Buyer filler (allow a token burn)    |  546 satoshi to buyer
        //  Seller SLP input                     |  Seller BCH output
        //  Buyer UTXO                           |  Buyer BCH change output
        //  ... buyer input UTXOs                |  

        let tokenUtxo: utxo = {
            txid: tokenOffer.token.txid,
            vout: tokenOffer.token.vout,
            satoshis: new BigNumber(tokenOffer.token.lockedSatoshis),
            scriptSig: tokenOffer.scriptSig,
            slpTransactionDetails: tokenOffer.token.details,
            slpUtxoJudgement: SlpUtxoJudgement.SLP_TOKEN,
            slpUtxoJudgementAmount: tokenOffer.token.qty
        }

        let inputs = [ ...Utils.mapToUtxoArray(buyerFillerUtxos), tokenUtxo, ...Utils.mapToUtxoArray(buyerPaymentUtxos) ];
        let change = [ { amount: tokenOffer.token.priceSatoshis, address: tokenOffer.paymentAddress } ]
                        .concat({ address: tokenClaimAddress, amount: buyerPaymentUtxos.map(txo => txo.satoshis).reduce((v, i) => v+=i, 0)-tokenOffer.token.priceSatoshis })

        if(buyerFillerUtxos.length !== 2)
            throw Error("There needs to be exactly 2 filler UTXOs to complete this trade transaction.");

        let config: configBuildRawSendTx;

        if(buyerFillerUtxos.every(txo => txo.slpUtxoJudgement === SlpUtxoJudgement.SLP_TOKEN )) {
            let burnIds = [ ... new Set<string>(buyerFillerUtxos.map(txo => { return txo.slpTransactionDetails.tokenIdHex })) ];
            if(burnIds.includes(tokenOffer.token.details.tokenIdHex))
                throw Error("You do not want burn the same type of token that you are purchasing.");
            config = {
                slpSendOpReturn: Buffer.from(tokenOffer.op_return, 'hex'),
                input_token_utxos: inputs,
                tokenReceiverAddressArray: [ tokenClaimAddress ],
                bchChangeReceiverAddress: tokenOffer.paymentAddress,
                explicitBchChange: change,
                allowTokenBurning: [ ... new Set<string>(buyerFillerUtxos.map(txo => { return txo.slpTransactionDetails.tokenIdHex })) ]
            }
        } else {
            config = {
                slpSendOpReturn: Buffer.from(tokenOffer.op_return, 'hex'),
                input_token_utxos: inputs,
                tokenReceiverAddressArray: [ tokenClaimAddress ],
                bchChangeReceiverAddress: tokenOffer.paymentAddress,
                explicitBchChange: change
            }
        }

        let tx = this.slp.buildRawSendTx(config);

        return tx;
    }
}