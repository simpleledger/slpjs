import { AddressUtxoResult } from "bitcoin-com-rest";
import * as bchaddr from 'bchaddrjs-slp';
import BigNumber from "bignumber.js";
import { BITBOX } from "bitbox-sdk";
import { Utils } from "..";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export enum PaymentStatus {
    "NOT_MONITORING" = "NOT_MONITORING",
    "WAITING_FOR_PAYMENT" = "WAITING_FOR_PAYMENT",
    "PAYMENT_TOO_LOW" = "PAYMENT_TOO_LOW",
    "PAYMENT_SUCCESS" = "PAYMENT_SUCCESS",
    "PAYMENT_CANCELLED" = "PAYMENT_CANCELLED",
    "ERROR" = "ERROR"
}

export class PaymentMonitor {
    BITBOX: BITBOX;
    paymentAddress?: string;
    paymentSatoshis?: number;
    addressUtxoResult: AddressUtxoResult|null = null;
    bchPaymentStatus = PaymentStatus.NOT_MONITORING;
    slpPaymentStatus = PaymentStatus.NOT_MONITORING;
    bchSatoshisReceived = 0;
    slpSatoshisReceived = new BigNumber(0);
    statusChangeCallback?: (result: AddressUtxoResult|null, status: PaymentStatus)=>any
    interval: number;
    //paymentTokenId?: string;
    //paymentSlpSatoshis?: BigNumber;

    constructor(BITBOX: BITBOX, statusChangeCallback?: (result: AddressUtxoResult|null, status: PaymentStatus)=>any, pollingIntervalMs=1000) {
        this.BITBOX = BITBOX;
        this.statusChangeCallback = statusChangeCallback;
        this.interval = pollingIntervalMs;
    }

    cancelPayment() {
        this._changeBchPaymentStatus(PaymentStatus.PAYMENT_CANCELLED);
    }

    _changeBchPaymentStatus(newStatus: PaymentStatus) {
        if(this.bchPaymentStatus === PaymentStatus.WAITING_FOR_PAYMENT && newStatus == PaymentStatus.WAITING_FOR_PAYMENT) {
            this._changeBchPaymentStatus(PaymentStatus.ERROR);
            throw Error("Already monitoring for a payment, cannot change state to waiting for a payment");
        }
        this.bchPaymentStatus = newStatus;
        if(this.statusChangeCallback)
            this.statusChangeCallback(this.addressUtxoResult, this.bchPaymentStatus)
    }

    async monitorForBchPayment(address: string, paymentSatoshis: number): Promise<void> {
        this.addressUtxoResult = null;
        this._changeBchPaymentStatus(PaymentStatus.WAITING_FOR_PAYMENT);
        this.paymentAddress = address;
        this.paymentSatoshis = paymentSatoshis;
        let result: AddressUtxoResult | undefined;
        // must be a cash or legacy addr
        if(!Utils.isCashAddress(this.paymentAddress) && !Utils.isLegacyAddress(this.paymentAddress)) 
            this.paymentAddress = Utils.toCashAddress(this.paymentAddress);
        while (this.bchPaymentStatus === PaymentStatus.WAITING_FOR_PAYMENT) {
            try {
                result = await this.getUtxos(address);
                console.log("waiting for payment");
                console.log("payment result", result);
                if (result && result.utxos.length > 0) {
                    this.bchSatoshisReceived = result.utxos.reduce((t,v) => t+=v.satoshis, 0);
                    if(result.utxos.reduce((t,v) => t+=v.satoshis, 0) >= paymentSatoshis) {
                        this.addressUtxoResult = result;
                        this._changeBchPaymentStatus(PaymentStatus.PAYMENT_SUCCESS);
                        break;
                    }
                }
            } catch (ex) {
                console.log(ex);
            }
            await sleep(this.interval);
        }
    }

    async getUtxos(address: string): Promise<AddressUtxoResult|undefined> {
        // must be a cash or legacy addr
        let res: AddressUtxoResult;
        if(!Utils.isCashAddress(address) && !Utils.isLegacyAddress(address)) 
            address = Utils.toCashAddress(address)
            //throw new Error("Not an a valid address format, must be cashAddr or Legacy address format.");
        res = (<AddressUtxoResult[]>await this.BITBOX.Address.utxo([ address ]))[0];
        return res;
    }

}