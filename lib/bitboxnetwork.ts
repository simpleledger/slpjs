import Axios from "axios";
import * as bchaddr from "bchaddrjs-slp";
import BigNumber from "bignumber.js";
import { BITBOX } from "bitbox-sdk";
import { AddressDetailsResult, AddressUtxoResult,
    TxnDetailsResult } from "bitcoin-com-rest";
import * as Bitcore from "bitcore-lib-cash";
import * as _ from "lodash";
import { INetwork, logger, Primatives,
    SlpAddressUtxoResult, SlpBalancesResult, SlpTransactionDetails,
    SlpTransactionType, SlpVersionType } from "../index";
import { Slp, SlpValidator } from "./slp";
import { TransactionHelpers } from "./transactionhelpers";
import { Utils } from "./utils";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class BitboxNetwork implements INetwork {
    public BITBOX: BITBOX;
    public slp: Slp;
    public validator?: SlpValidator;
    public txnHelpers: TransactionHelpers;
    public logger: logger = { log: (s: string) => null };

    constructor(BITBOX: BITBOX, validator?: SlpValidator, logger?: logger) {
        if (!BITBOX) {
            throw Error("Must provide BITBOX instance to class constructor.");
        }
        if (logger) {
            this.logger = logger;
        }
        if (validator) {
            this.validator = validator;
        }
        this.BITBOX = BITBOX;
        this.slp = new Slp(BITBOX);
        this.txnHelpers = new TransactionHelpers(this.slp);
    }

    public async getTokenInformation(txid: string, decimalConversion= false): Promise<SlpTransactionDetails|any> {
        let res: string[];
        try {
            res = (await this.BITBOX.RawTransactions.getRawTransaction([txid]) as string[]|any);
        } catch (e) {
            throw Error(e.error);
        }
        if (!Array.isArray(res) || res.length !== 1) {
            throw Error("BITBOX response error for 'RawTransactions.getRawTransaction'");
        }
        const txhex = res[0];
        const txn: Bitcore.Transaction = new Bitcore.Transaction(txhex);
        const slpMsg = this.slp.parseSlpOutputScript(txn.outputs[0]._scriptBuffer);
        if (decimalConversion) {
            if ([SlpTransactionType.GENESIS, SlpTransactionType.MINT].includes(slpMsg.transactionType)) {
                slpMsg.genesisOrMintQuantity = slpMsg.genesisOrMintQuantity!.dividedBy(10 ** slpMsg.decimals);
            } else {
                slpMsg.sendOutputs!.map((o) => o.dividedBy(10 ** slpMsg.decimals));
            }
        }
        if (SlpTransactionType.GENESIS === slpMsg.transactionType) {
            slpMsg.tokenIdHex = txid;
        }
        return slpMsg;
    }

    // WARNING: this method is limited to 60 transactions per minute
    public async getTransactionDetails(txid: string, decimalConversion = false) {
        const txn: any = (await this.BITBOX.Transaction.details([ txid ]) as TxnDetailsResult[])[0];
        // add slp address format to transaction details
        txn.vin.forEach((input: any) => {
            try { input.slpAddress = Utils.toSlpAddress(input.legacyAddress); } catch (_) {}
        });
        txn.vout.forEach((output: any) => {
            try { output.scriptPubKey.slpAddrs = [ Utils.toSlpAddress(output.scriptPubKey.cashAddrs[0]) ]; } catch (_) {}
        });
        // add token information to transaction details
        txn.tokenInfo = await this.getTokenInformation(txid, decimalConversion);
        txn.tokenIsValid = this.validator ?
            await this.validator.isValidSlpTxid(txid, null, null, this.logger) :
            await this.isValidSlpTxid(txid);

        // add tokenNftParentId if token is a NFT child
        if (txn.tokenIsValid && txn.tokenInfo.versionType === SlpVersionType.TokenVersionType1_NFT_Child) {
            txn.tokenNftParentId = await this.getNftParentId(txn.tokenInfo.tokenIdHex);
        }

        return txn;
    }

    public async getUtxos(address: string) {
        // must be a cash or legacy addr
        let res: AddressUtxoResult;
        if (!bchaddr.isCashAddress(address) && !bchaddr.isLegacyAddress(address)) {
            throw new Error("Not an a valid address format, must be cashAddr or Legacy address format.");
        }
        res = (await this.BITBOX.Address.utxo([address]) as AddressUtxoResult[])[0];
        return res;
    }

    public async getAllSlpBalancesAndUtxos(address: string|string[]): Promise<SlpBalancesResult | Array<{
        address: string;
        result: SlpBalancesResult;
    }>> {
        if (typeof address === "string") {
            address = bchaddr.toCashAddress(address);
            const result = await this.getUtxoWithTxDetails(address);
            return await this.processUtxosForSlp(result);
        }
        address = address.map((a) => bchaddr.toCashAddress(a));
        const results: Array<{ address: string, result: SlpBalancesResult }> = [];
        for (let i = 0; i < address.length; i++) {
            const utxos = await this.getUtxoWithTxDetails(address[i]);
            results.push({ address: Utils.toSlpAddress(address[i]), result: await this.processUtxosForSlp(utxos) });
        }
        return results;
    }

    // Sent SLP tokens to a single output address with change handled
    // (Warning: Sweeps all BCH/SLP UTXOs for the funding address)
    public async simpleTokenSend(
        tokenId: string, sendAmounts: BigNumber|BigNumber[], inputUtxos: SlpAddressUtxoResult[],
        tokenReceiverAddresses: string|string[], changeReceiverAddress: string, requiredNonTokenOutputs
        : Array<{ satoshis: number, receiverAddress: string }> = []) {
        const txHex = this.txnHelpers.simpleTokenSend({
            tokenId, sendAmounts, inputUtxos, tokenReceiverAddresses,
            changeReceiverAddress, requiredNonTokenOutputs,
        });

        if (!inputUtxos.every((i) => typeof i.wif === "string")) {
            throw Error("The BitboxNetwork version of this method requires a private key WIF be provided with each input." +
                        "If you want more control over the signing process use Slp.simpleTokenSend() to get the unsigned transaction," +
                        "then after the transaction is signed you can use BitboxNetwork.sendTx()");
        }

        return await this.sendTx(txHex);
    }

    public async simpleBchSend(
        sendAmounts: BigNumber|BigNumber[], inputUtxos: SlpAddressUtxoResult[],
        bchReceiverAddresses: string|string[], changeReceiverAddress: string) {
        const genesisTxHex = this.txnHelpers.simpleBchSend({
            sendAmounts, inputUtxos, bchReceiverAddresses, changeReceiverAddress,
        });
        return await this.sendTx(genesisTxHex);
    }

    public async simpleTokenGenesis(
        tokenName: string, tokenTicker: string, tokenAmount: BigNumber, documentUri: string|null,
        documentHash: Buffer|null, decimals: number, tokenReceiverAddress: string, batonReceiverAddress: string,
        bchChangeReceiverAddress: string, inputUtxos: SlpAddressUtxoResult[]) {
        const genesisTxHex = this.txnHelpers.simpleTokenGenesis({
            tokenName, tokenTicker, tokenAmount, documentUri, documentHash, decimals,
            tokenReceiverAddress, batonReceiverAddress, bchChangeReceiverAddress, inputUtxos,
        });
        return await this.sendTx(genesisTxHex);
    }

    public async simpleNFT1ParentGenesis(
        tokenName: string, tokenTicker: string, tokenAmount: BigNumber,
        documentUri: string|null, documentHash: Buffer|null, tokenReceiverAddress: string,
        batonReceiverAddress: string, bchChangeReceiverAddress: string,
        inputUtxos: SlpAddressUtxoResult[], decimals= 0) {
        const genesisTxHex = this.txnHelpers.simpleNFT1ParentGenesis({
            tokenName, tokenTicker, tokenAmount, documentUri, documentHash,
            tokenReceiverAddress, batonReceiverAddress, bchChangeReceiverAddress, inputUtxos, decimals,
        });
        return await this.sendTx(genesisTxHex);
    }

    public async simpleNFT1ChildGenesis(
        nft1GroupId: string, tokenName: string, tokenTicker: string, documentUri: string|null,
        documentHash: Buffer|null, tokenReceiverAddress: string, bchChangeReceiverAddress: string,
        inputUtxos: SlpAddressUtxoResult[], allowBurnAnyAmount= false) {
        const genesisTxHex = this.txnHelpers.simpleNFT1ChildGenesis({
            nft1GroupId, tokenName, tokenTicker, documentUri, documentHash, tokenReceiverAddress,
            bchChangeReceiverAddress, inputUtxos, allowBurnAnyAmount,
        });
        return await this.sendTx(genesisTxHex);
    }

    // Sent SLP tokens to a single output address with change handled
    // (Warning: Sweeps all BCH/SLP UTXOs for the funding address)
    public async simpleTokenMint(
        tokenId: string, mintAmount: BigNumber, inputUtxos: SlpAddressUtxoResult[],
        tokenReceiverAddress: string, batonReceiverAddress: string, changeReceiverAddress: string) {
        const txHex = this.txnHelpers.simpleTokenMint({
            tokenId, mintAmount, inputUtxos, tokenReceiverAddress, batonReceiverAddress, changeReceiverAddress,
        });
        return await this.sendTx(txHex);
    }

    // Burn a precise quantity of SLP tokens with remaining tokens (change) sent to a
    // single output address (Warning: Sweeps all BCH/SLP UTXOs for the funding address)
    public async simpleTokenBurn(
        tokenId: string, burnAmount: BigNumber, inputUtxos: SlpAddressUtxoResult[], changeReceiverAddress: string) {
        const txHex = this.txnHelpers.simpleTokenBurn({
            tokenId, burnAmount, inputUtxos, changeReceiverAddress,
        });
        return await this.sendTx(txHex);
    }

    public async getUtxoWithRetry(address: string, retries = 40) {
        let result: AddressUtxoResult | undefined;
        let count = 0;
        while (result === undefined) {
            result = await this.getUtxos(address);
            count++;
            if (count > retries) {
                throw new Error("this.BITBOX.Address.utxo endpoint experienced a problem");
            }
            await sleep(250);
        }
        return result;
    }

    public async getUtxoWithTxDetails(address: string) {
        let utxos = Utils.mapToSlpAddressUtxoResultArray(await this.getUtxoWithRetry(address));
        const txIds = utxos.map((i: { txid: string; }) => i.txid);
        if (txIds.length === 0) {
            return [];
        }
        // Split txIds into chunks of 20 (BitBox limit), run the detail queries in parallel
        let txDetails: any[] = (await Promise.all(_.chunk(txIds, 20).map((txids: any[]) => {
            return this.getTransactionDetailsWithRetry([...new Set(txids)]);
        })));
        // concat the chunked arrays
        txDetails = ([].concat(...txDetails) as TxnDetailsResult[]);
        utxos = utxos.map((i: SlpAddressUtxoResult) => { i.tx = txDetails.find((d: TxnDetailsResult) => d.txid === i.txid ); return i; });
        return utxos;
    }

    public async getTransactionDetailsWithRetry(txids: string[], retries = 40) {
        let result!: TxnDetailsResult[];
        let count = 0;
        while (result === undefined) {
            result = (await this.BITBOX.Transaction.details(txids) as TxnDetailsResult[]);
            if (result) {
                return result;
            }
            count++;
            if (count > retries) {
                throw new Error("this.BITBOX.Address.details endpoint experienced a problem");
            }
            await sleep(250);
        }
    }

    public async getAddressDetailsWithRetry(address: string, retries = 40) {
        // must be a cash or legacy addr
        if (!bchaddr.isCashAddress(address) && !bchaddr.isLegacyAddress(address)) {
            throw new Error("Not an a valid address format, must be cashAddr or Legacy address format.");
        }
        let result: AddressDetailsResult[] | undefined;
        let count = 0;
        while (result === undefined) {
            result = (await this.BITBOX.Address.details([address]) as AddressDetailsResult[]);
            if (result) {
                return result[0];
            }
            count++;
            if (count > retries) {
                throw new Error("this.BITBOX.Address.details endpoint experienced a problem");
            }
            await sleep(250);
        }
    }

    public async sendTx(hex: string): Promise<string> {
        const res = await this.BITBOX.RawTransactions.sendRawTransaction([ hex ]as any);
        // console.log(res);
        if (typeof res === "object") {
            return (res as string[])[0];
        }
        return res;
    }

    public async monitorForPayment(paymentAddress: string, fee: number, onPaymentCB: Function) {
        let utxo: AddressUtxoResult | undefined;
        // must be a cash or legacy addr
        if (!bchaddr.isCashAddress(paymentAddress) && !bchaddr.isLegacyAddress(paymentAddress)) {
            throw new Error("Not an a valid address format, must be cashAddr or Legacy address format.");
        }
        while (true) {
            try {
                utxo = await this.getUtxos(paymentAddress);
                if (utxo && utxo.utxos[0].satoshis >= fee) {
                    break;
                }
            } catch (ex) {
                console.log(ex);
            }
            await sleep(2000);
        }
        onPaymentCB();
    }

    public async getRawTransactions(txids: string[]): Promise<string[]> {
        if (this.validator && this.validator.getRawTransactions) {
            return await this.validator.getRawTransactions(txids);
        }
        return await this.BITBOX.RawTransactions.getRawTransaction(txids) as any[];
    }

    public async processUtxosForSlp(utxos: SlpAddressUtxoResult[]): Promise<SlpBalancesResult> {
        return await this.slp.processUtxosForSlpAbstract(utxos, this);
    }

    public async isValidSlpTxid(txid: string): Promise<boolean> {
        if (this.validator) {
            return await this.validator.isValidSlpTxid(txid, null, null, this.logger);
        }
        // WARNING: the following method is limited to 60 transactions per minute
        const validatorUrl = this.setRemoteValidatorUrl();
        this.logger.log("SLPJS Validating (remote: " + validatorUrl + "): " + txid);
        const result = await Axios({
            method: "post",
            url: validatorUrl,
            data: {
                txids: [ txid ],
            },
        });
        let res = false;
        if (result && result.data) {
           res = (result.data as Array<{ txid: string, valid: boolean }>).filter((i) => i.valid).length > 0 ? true : false;
        }
        this.logger.log("SLPJS Validator Result: " + res + " (remote: " + validatorUrl + "): " + txid);
        return res;
    }

    public async validateSlpTransactions(txids: string[]): Promise<string[]> {
        if (this.validator) {
            return await this.validator.validateSlpTransactions(txids);
        }
        const validatorUrl = this.setRemoteValidatorUrl();

        const promises = _.chunk(txids, 20).map((ids) => Axios({
            method: "post",
            url: validatorUrl,
            data: {
                txids: ids,
            },
        }));
        const results = await Axios.all(promises);
        const result = { data: [] };
        results.forEach((res) => {
            if (res.data) {
                result.data = result.data.concat(res.data);
            }
        });
        if (result && result.data) {
            return (result.data as Array<{ txid: string, valid: boolean }>)
                    .filter((i) => i.valid).map((i) => i.txid);
        }
        return [];
    }

    public async getNftParentId(tokenIdHex: string) {
        const txnhex = (await this.getRawTransactions([tokenIdHex]))[0];
        const tx = Primatives.Transaction.parseFromBuffer(Buffer.from(txnhex, "hex"));
        const nftBurnTxnHex = (await this.getRawTransactions([tx.inputs[0].previousTxHash]))[0];
        const nftBurnTxn = Primatives.Transaction.parseFromBuffer(Buffer.from(nftBurnTxnHex, "hex"));
        const slp = new Slp(this.BITBOX);
        const nftBurnSlp = slp.parseSlpOutputScript(Buffer.from(nftBurnTxn.outputs[0].scriptPubKey));
        if (nftBurnSlp.transactionType === SlpTransactionType.GENESIS) {
            return tx.inputs[0].previousTxHash;
        } else {
            return nftBurnSlp.tokenIdHex;
        }
    }

    private setRemoteValidatorUrl() {
        let validatorUrl = this.BITBOX.restURL.replace("v1", "v2");
        validatorUrl = validatorUrl.concat("/slp/validateTxid");
        validatorUrl = validatorUrl.replace("//slp", "/slp");
        return validatorUrl;
    }
}
