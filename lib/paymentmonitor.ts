import { AddressUtxoResult } from "bitcoin-com-rest";
import * as bchaddr from 'bchaddrjs-slp';
import BigNumber from "bignumber.js";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export enum PaymentStatus {
    "NOT_MONITORING" = "NOT_MONITORING",
    "WAITING_FOR_PAYMENT" = "WAITING_FOR_PAYMENT",
    "PAYMENT_TOO_LOW" = "PAYMENT_TOO_LOW",
    "PAYMENT_SUCCESS" = "PAYMENT_SUCCESS",
    "PAYMENT_CANCELLED" = "PAYMENT_CANCELLED"
}

export class PaymentMonitor {
    paymentAddress?: string;
    paymentSatoshis?: number;
    bchPaymentStatus = PaymentStatus.NOT_MONITORING;
    slpPaymentStatus = PaymentStatus.NOT_MONITORING;
    bchSatoshisReceived = 0;
    slpSatoshisReceived = new BigNumber(0);
    getUtxos: (address: string) => Promise<AddressUtxoResult|undefined>
    //paymentTokenId?: string;
    //paymentSlpSatoshis?: BigNumber;

    constructor(getUtxos: (address: string) => Promise<AddressUtxoResult|undefined>) {
        this.getUtxos = getUtxos;
    }

    cancelPayment() {
        this.bchPaymentStatus = PaymentStatus.PAYMENT_CANCELLED;
    }

    async monitorForBchPayment(address: string, paymentSatoshis: number, onPaymentCB: (res:AddressUtxoResult)=>any): Promise<void> {
        if(this.bchPaymentStatus === PaymentStatus.WAITING_FOR_PAYMENT)
            throw Error("Already monitoring for a payment.");
        this.bchPaymentStatus = PaymentStatus.WAITING_FOR_PAYMENT;
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
                        this.bchPaymentStatus = PaymentStatus.PAYMENT_SUCCESS;
                        onPaymentCB(result);
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