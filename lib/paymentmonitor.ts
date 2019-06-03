import { AddressUtxoResult } from "bitcoin-com-rest";
import * as bchaddr from 'bchaddrjs-slp';
import BigNumber from "bignumber.js";

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
    paymentAddress?: string;
    paymentSatoshis?: number;
    addressUtxoResult: AddressUtxoResult|null = null;
    bchPaymentStatus = PaymentStatus.NOT_MONITORING;
    slpPaymentStatus = PaymentStatus.NOT_MONITORING;
    bchSatoshisReceived = 0;
    slpSatoshisReceived = new BigNumber(0);
    statusChangeCallback?: (result: AddressUtxoResult|null, status: PaymentStatus)=>any
    getUtxos: (address: string) => Promise<AddressUtxoResult|undefined>
    //paymentTokenId?: string;
    //paymentSlpSatoshis?: BigNumber;

    constructor(getUtxos: (address: string) => Promise<AddressUtxoResult|undefined>, statusChangeCallback?: (result: AddressUtxoResult|null, status: PaymentStatus)=>any) {
        this.getUtxos = getUtxos;
        this.statusChangeCallback = statusChangeCallback;
    }

    cancelPayment() {
        this.bchPaymentStatus = PaymentStatus.PAYMENT_CANCELLED;
    }

    _changeBchPaymentStatus(newStatus: PaymentStatus) {
        if(this.bchPaymentStatus === newStatus) {
            this._changeBchPaymentStatus(PaymentStatus.ERROR);
            throw Error("Already monitoring for a payment, status cannot be changed to the same state");
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
        if(!bchaddr.isCashAddress(this.paymentAddress) && !bchaddr.isLegacyAddress(this.paymentAddress)) 
            throw new Error("Not an a valid address format, must be cashAddr or Legacy address format.");
        while (this.bchPaymentStatus === PaymentStatus.WAITING_FOR_PAYMENT) {
            try {
                result = await this.getUtxos(address);
                if (result) {
                    this.bchSatoshisReceived = result.utxos.reduce((t,v) => t+=v.satoshis, 0);
                    if(result.utxos.reduce((t,v) => t+=v.satoshis,0) >= paymentSatoshis) {
                        this.addressUtxoResult = result;
                        this._changeBchPaymentStatus(PaymentStatus.PAYMENT_SUCCESS);
                        break;
                    }
                }
            } catch (ex) {
                console.log(ex);
            }
            await sleep(1000);
        }
    }
}