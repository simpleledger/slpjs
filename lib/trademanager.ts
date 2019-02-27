import BITBOXSDK from 'bitbox-sdk/lib/bitbox-sdk';
import { SlpAddressUtxoResult, Utils, SlpTransactionDetails, utxo, SlpUtxoJudgement } from '..';
import { Slp, configBuildSendOpReturn, configBuildRawSendTx } from './slp';
import BigNumber from 'bignumber.js';
import * as Bitcore from 'bitcore-lib-cash';
import { TxOut } from 'bitbox-sdk/lib/Blockchain';

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

    createSlpForBchOffer(utxo: SlpAddressUtxoResult, priceSatoshis: number, paymentAddress: string, label?: string): SlpTokenOffer {
        // Seller creates a partially signed transaction using SINGLE|ANYONECANPAY
        // -----------------------------------------------------------------------
        // inputs                    |  outputs
        // --------------------------|--------------------------------------------
        //  dummy                    |  empty (TO BE REPLACED WITH SLP MSG)
        //  dummy                    |  empty (TO BE REPLACED WITH 546)
        //  Seller Signed SLP input  |  Seller Signed BCH output

        let tb = new this.BITBOX.TransactionBuilder(Utils.txnBuilderString(paymentAddress));
        tb.addInput(dummyTxid, 0);
        tb.addInput(dummyTxid, 1);
        tb.addInput(utxo.txid, utxo.vout);
        tb.addOutput(dummyScriptPubKey, 0);
        tb.addOutput(dummyScriptPubKey, 0);
        tb.addOutput(Utils.toCashAddress(paymentAddress), Math.round(priceSatoshis));
        tb.sign(0, this.BITBOX.ECPair.fromWIF(utxo.wif), undefined, tb.hashTypes.SIGHASH_ALL, 546);
        tb.sign(1, this.BITBOX.ECPair.fromWIF(utxo.wif), undefined, tb.hashTypes.SIGHASH_ALL, 546);
        tb.sign(2, this.BITBOX.ECPair.fromWIF(utxo.wif), undefined, tb.hashTypes.SIGHASH_SINGLE | tb.hashTypes.SIGHASH_ANYONECANPAY | tb.hashTypes.SIGHASH_BITCOINCASH_BIP143, utxo.satoshis);

        let tx = tb.transaction.build();
        
        let config: configBuildSendOpReturn = {
            tokenIdHex: utxo.slpTransactionDetails.tokenIdHex, 
            outputQtyArray: [ utxo.slpUtxoJudgementAmount ]
        }

        let script = this.slp.buildSendOpReturn(config);

        let offer: SlpTokenOffer = {
            label: label ? label : null, 
            isSpent: false,
            op_return: script.toString('hex'), 
            dummyHex: tx.toHex(), 
            scriptSig: tx.ins[2].script,
            token: { 
                lockedSatoshis: utxo.satoshis,
                qty: utxo.slpUtxoJudgementAmount,
                priceSatoshis: priceSatoshis, 
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

    createSlpForBchPurchase(tokenOffer: SlpTokenOffer, buyerPaymentUtxos: SlpAddressUtxoResult[], buyerAddress: string) {
        // Buyer completes the parially signed transaction
        // ----------------------------------------------------------- 
        // inputs                                |  outputs
        // --------------------------------------|--------------------
        //  Buyer filler (allow a token burn)    |  SLP OP_RETURN
        //  Buyer filler (allow a token burn)    |  546 satoshi to buyer
        //  Seller SLP input                     |  Seller BCH output
        //  Buyer UTXO                           |  Buyer BCH change output
        //  ... buyer input UTXOs                |  

        if(tokenOffer.isSpent)
            throw Error("This token offer has already been spent.")

        let signedTokenInput: utxo = {
            txid: tokenOffer.token.txid,
            vout: tokenOffer.token.vout,
            satoshis: new BigNumber(tokenOffer.token.lockedSatoshis),
            scriptSig: tokenOffer.scriptSig,
            slpTransactionDetails: tokenOffer.token.details,
            slpUtxoJudgement: SlpUtxoJudgement.SLP_TOKEN,
            slpUtxoJudgementAmount: tokenOffer.token.qty
        }

        let inputs;
        if(buyerPaymentUtxos.length > 2)
            inputs = [ ...Utils.mapToUtxoArray(buyerPaymentUtxos.slice(0,2)), signedTokenInput, ...Utils.mapToUtxoArray(buyerPaymentUtxos.slice(2)) ];
        else if(buyerPaymentUtxos.length === 2)
            inputs = [ ...Utils.mapToUtxoArray(buyerPaymentUtxos), signedTokenInput ];
        else
            throw Error("Must have at least 2 input UTXOs supplied by the buyer.");

        if(buyerPaymentUtxos.map(txo => txo.satoshis).reduce((v, i) => v+=i, 0) - tokenOffer.token.priceSatoshis < 0)
            throw Error("Insufficient input satoshis.")

        let change = [ { amount: tokenOffer.token.priceSatoshis, address: tokenOffer.paymentAddress } ]

        let feeEstimate = this.BITBOX.BitcoinCash.getByteCount({ P2PKH: buyerPaymentUtxos.length + 1 }, { P2PKH: 3 }) + (tokenOffer.op_return.length / 2) + 20

        if(buyerPaymentUtxos.map(txo => txo.satoshis).reduce((v, i) => v+=i, 0) - tokenOffer.token.priceSatoshis - feeEstimate > 546) {
            change = change.concat({ 
                address: buyerAddress, 
                amount: buyerPaymentUtxos.map(txo => txo.satoshis).reduce((v, i) => v+=i, 0) - tokenOffer.token.priceSatoshis - feeEstimate
            })
        }

        let config: configBuildRawSendTx = {
            slpSendOpReturn: Buffer.from(tokenOffer.op_return, 'hex'),
            input_token_utxos: inputs,
            tokenReceiverAddressArray: [ buyerAddress ],
            bchChangeReceiverAddress: tokenOffer.paymentAddress,
            explicitBchChange: change
        }
        
        if(buyerPaymentUtxos.find(txo => txo.slpUtxoJudgement === SlpUtxoJudgement.SLP_TOKEN )) {
            let allowBurnFor = buyerPaymentUtxos.map(txo => { 
                if(txo.slpUtxoJudgement === SlpUtxoJudgement.SLP_TOKEN) return txo.slpTransactionDetails.tokenIdHex 
                else return "";
            }).filter(s => s !== "");
            config.allowTokenBurning = [ ... new Set<string>(allowBurnFor) ];
        }

        let tx = this.slp.buildRawSendTx(config);

        return tx;
    }

    async parseTokenOfferFromDummy(dummyHex: string): Promise<SlpTokenOffer> {
        let txn = new Bitcore.Transaction(dummyHex);
        let slp = new Slp(this.BITBOX);
        let slpMsg: SlpTransactionDetails;
        try {
            slpMsg = slp.parseSlpOutputScript(txn.outputs[0]._scriptBuffer);
        } catch(_) {
            throw Error("Not a valid SLP transaction.");
        }
        
        let txid = txn.inputs[2].prevTxId.toString('hex');
        let vout = txn.inputs[2].outputIndex;

        let txo: TxOut|null = await this.BITBOX.Blockchain.getTxOut(txid, vout, true);

        let offer: SlpTokenOffer;

        if(txo)
            offer = {
                label: "",
                isSpent: false,
                op_return: txn.outputs[0]._scriptBuffer.toString('hex'),
                dummyHex: dummyHex,
                scriptSig: txn.inputs[2]._scriptBuffer,
                token: { 
                    lockedSatoshis: Math.round(txo.value*10**8),
                    qty: slpMsg.sendOutputs![1], 
                    priceSatoshis: txn.outputs[2].satoshis, 
                    txid: txid, 
                    vout: vout, 
                    details: slpMsg 
                },
                paymentAddress: this.BITBOX.Address.fromOutputScript(txn.outputs[2]._scriptBuffer)
            }
        else {
            offer = {
                label: "",
                isSpent: true,
                op_return: txn.outputs[0]._scriptBuffer.toString('hex'),
                dummyHex: dummyHex,
                scriptSig: txn.inputs[2]._scriptBuffer,
                token: { 
                    lockedSatoshis: 0,
                    qty: new BigNumber(0), 
                    priceSatoshis: txn.outputs[2].satoshis, 
                    txid: txid, 
                    vout: vout, 
                    details: slpMsg 
                },
                paymentAddress: this.BITBOX.Address.fromOutputScript(txn.outputs[2]._scriptBuffer)
            }
        }

        return offer;
    }
}