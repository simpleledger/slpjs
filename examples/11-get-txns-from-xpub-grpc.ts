import * as bitcore from "bitcore-lib-cash";
import { GrpcClient, Transaction } from "grpc-bchrpc-node";
import { Utils } from "../lib/utils";

const gprc = new GrpcClient();

// user variables
const tokenId = "";
const address = "";

const xpub = "xpub661MyMwAqRbcEmunind5AZXnevFW66TB3vq5MHM5Asq8UNaEdTsgk4njwUXW4RGywGK68au91R1rvjQ6SmJQEUwUinjYZPnJA7o72bG5HFr";
// @ts-ignore
const hdPublickey = new bitcore.HDPublicKey(xpub);
const accountDerivation = "m/0/";  //  this is the account part of the non-hardened HD path so, "/<account>/<address>/"
let lastFoundActiveAddressIndex = 0;
const addressGapScanDepth = 10;  // this is the gap that will be maintained past the "lastActiveAddressIndex"
let transactionHistory: Transaction[] = [];

// main scanning loop
(async () => {
    for (let i = 0; i < lastFoundActiveAddressIndex + addressGapScanDepth; i++) {
        // get address
        const orderPublickey = hdPublickey.deriveChild(accountDerivation + i.toFixed());
        // @ts-ignore
        const pubkey = new bitcore.PublicKey(orderPublickey.publicKey);
        // @ts-ignore
        const address = bitcore.Address.fromPublicKey(pubkey, bitcore.Networks.mainnet).toString();
        console.log(address);
        //const cashAddr = Utils.toCashAddress(address);
        //console.log(cashAddr);
        const res = await gprc.getAddressTransactions({address});
        if (res.getConfirmedTransactionsList().length > 0) {
            lastFoundActiveAddressIndex = i;
            transactionHistory.push(...res.getConfirmedTransactionsList());
            console.log("Has transactions!");
        }
        console.log(transactionHistory.length);
    }
})();
