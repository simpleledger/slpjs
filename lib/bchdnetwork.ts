import * as bchaddr from "bchaddrjs-slp";
import BigNumber from "bignumber.js";
import { BITBOX } from "bitbox-sdk";
import { AddressDetailsResult, AddressUtxoResult,
    TxnDetailsResult, utxo } from "bitcoin-com-rest";
import * as Bitcore from "bitcore-lib-cash";
import { IGrpcClient, Transaction } from "grpc-bchrpc";
import * as _ from "lodash";
import { INetwork, logger, Primatives,
    SlpAddressUtxoResult, SlpBalancesResult,
    SlpTransactionDetails, SlpTransactionType,
    SlpTxnDetailsResult, SlpVersionType } from "../index";
import { Slp, SlpValidator } from "./slp";
import { TransactionHelpers } from "./transactionhelpers";
import { Utils } from "./utils";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class BchdNetwork implements INetwork {
    public BITBOX: BITBOX;
    public slp: Slp;
    public validator: SlpValidator;
    public txnHelpers: TransactionHelpers;
    public logger: logger = { log: (s: string) => null };
    public client: IGrpcClient;

    constructor({ BITBOX, validator, logger, client }:
        { BITBOX: BITBOX, client: IGrpcClient, validator: SlpValidator, logger?: logger }) {
        if (!BITBOX) {
            throw Error("Must provide BITBOX instance to class constructor.");
        }
        if (!client) {
            throw Error("Must provide instance of GrpClient to class constructor.");
        }
        if (logger) {
            this.logger = logger;
        }
        this.validator = validator;
        this.BITBOX = BITBOX;
        this.client = client;
        this.slp = new Slp(BITBOX);
        this.txnHelpers = new TransactionHelpers(this.slp);
    }

    public async getTokenInformation(txid: string, decimalConversion = false): Promise<SlpTransactionDetails> {
        let txhex: Buffer;
        txhex = Buffer.from((await this.client.getRawTransaction({hash: txid, reversedHashOrder: true })).getTransaction_asU8());
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

    public async getTransactionDetails(txid: string): Promise<SlpTxnDetailsResult|undefined> {
        const res = await this.getTransactionDetailsWithRetry([txid], 1);
        if (!res) {
            return res;
        }
        return res[0];
    }

    public async getUtxos(address: string): Promise<AddressUtxoResult> {
        // must be a cash or legacy addr
        if (!bchaddr.isCashAddress(address) && !bchaddr.isLegacyAddress(address)) {
            throw new Error("Not an a valid address format, must be cashAddr or Legacy address format.");
        }
        const cashAddress = bchaddr.toCashAddress(address);
        const legacyAddress = bchaddr.toLegacyAddress(address);
        const res = (await this.client.getAddressUtxos({address, includeMempool: true})).getOutputsList();
        if (res.length === 0) {
            return {
                cashAddress,
                legacyAddress,
                scriptPubKey: null,
                utxos: [],
            } as any as AddressUtxoResult;
        }
        const scriptPubKey = Buffer.from(res[0].getPubkeyScript_asU8()).toString("hex");

        const bestHeight = (await this.client.getBlockchainInfo()).getBestHeight();
        let utxos: utxo[] = [];
        if (res.length > 0) {
            utxos = res.map((txo: { getValue: () => number; getBlockHeight: () => number; getOutpoint: () => any; }) => {
                return {
                    satoshis: txo.getValue(),
                    height: txo.getBlockHeight() < 2147483647 ? txo.getBlockHeight() : -1,
                    confirmations: txo.getBlockHeight() < 2147483647 ? bestHeight - txo.getBlockHeight() + 1 : null,
                    txid: Buffer.from(txo.getOutpoint()!.getHash_asU8().reverse()).toString("hex"),
                    vout: txo.getOutpoint()!.getIndex(),
                    amount: txo.getValue() / 10 ** 8,
                } as any as utxo;
            });
        }
        return {
            cashAddress,
            legacyAddress,
            scriptPubKey,
            utxos,
        };
    }

    public async getAllSlpBalancesAndUtxos(address: string | string[])
    : Promise<SlpBalancesResult | Array<{ address: string; result: SlpBalancesResult; }>> {
        if (typeof address === "string") {
            address = bchaddr.toCashAddress(address);
            const result = await this.getUtxoWithTxDetails(address);
            return await this.processUtxosForSlp(result);
        }
        address = address.map((a) => bchaddr.toCashAddress(a));
        const results: Array<{ address: string, result: SlpBalancesResult }> = [];
        for (const addr of address) {
            const utxos = await this.getUtxoWithTxDetails(addr);
            results.push({ address: Utils.toSlpAddress(addr), result: await this.processUtxosForSlp(utxos) });
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

    public async getUtxoWithRetry(address: string, retries = 40): Promise<AddressUtxoResult> {
        return await this.getUtxos(address);
    }

    public async getUtxoWithTxDetails(address: string): Promise<SlpAddressUtxoResult[]> {
        const res = await this.getUtxos(address);
        let utxos = Utils.mapToSlpAddressUtxoResultArray(res);
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

//   export interface TxnDetailsResult {
//     txid: string
//     version: number
//     locktime: number
//     vin: object[]
//     vout: object[]
//     blockhash: string
//     blockheight: number
//     confirmations: number
//     time: number
//     blocktime: number
//     isCoinBase: boolean
//     valueOut: number
//     size: number
//   }

    public async getTransactionDetailsWithRetry(txids: string[], retries = 40):
    Promise<SlpTxnDetailsResult[]|undefined> {
        const results: Transaction[] = [];
        let count = 0;
        while (results.length !== txids.length) {
            for (const txid of txids) {
                const res = (await this.client
                                        .getTransaction({hash: txid, reversedHashOrder: true}))
                                        .getTransaction();
                if (res) {
                    results.push(res);
                }
            }
            if (results.length === txids.length) {
                let txns: TxnDetailsResult[];
                txns = results.map((res: Transaction) => {
                    return {
                        txid: Buffer.from(res.getHash_asU8().reverse()).toString("hex"),
                        version: res.getVersion(),
                        locktime: res.getLockTime(),
                        vin: res.getInputsList().map((i: { getIndex: () => any; getSequence: () => any; }) => {
                            return {
                                n: i.getIndex(),
                                sequence: i.getSequence(),
                                coinbase: null,
                            }; }),
                        vout: res.getOutputsList().map((o: { getValue: () => any; getIndex: () => any; getPubkeyScript_asU8: () => ArrayBuffer | SharedArrayBuffer; getDisassembledScript: () => any; }) => {
                            return {
                                value: o.getValue(),
                                n: o.getIndex(),
                                scriptPubKey: {
                                    hex: Buffer.from(o.getPubkeyScript_asU8()).toString("hex"),
                                    asm: o.getDisassembledScript(),
                                },
                            }; }),
                        time: res.getTimestamp(),
                        blockhash: Buffer.from(res.getBlockHash_asU8().reverse()).toString("hex"),
                        blockheight: res.getBlockHeight(),
                        isCoinBase: false,
                        valueOut: res.getOutputsList().reduce((p: any, o: { getValue: () => any; }) => p += o.getValue(), 0),
                        size: res.getSize(),
                    } as TxnDetailsResult;
                });

                for (const txn of txns) {
                    // add slp address format to transaction details
                    txn.vin.forEach((input: any) => {
                        try { input.slpAddress = Utils.toSlpAddress(input.legacyAddress); } catch (_) {}
                    });
                    txn.vout.forEach((output: any) => {
                        try { output.scriptPubKey.slpAddrs = [ Utils.toSlpAddress(output.scriptPubKey.cashAddrs[0]) ]; } catch (_) {}
                    });
                    // add token information to transaction details
                    (txn as SlpTxnDetailsResult).tokenInfo = await this.getTokenInformation(txn.txid, true);
                    (txn as SlpTxnDetailsResult).tokenIsValid = this.validator ?
                        await this.validator.isValidSlpTxid(txn.txid, null, null, this.logger) :
                        await this.isValidSlpTxid(txn.txid);

                    // add tokenNftParentId if token is a NFT child
                    if ((txn as SlpTxnDetailsResult).tokenIsValid && (txn as SlpTxnDetailsResult).tokenInfo.versionType === SlpVersionType.TokenVersionType1_NFT_Child) {
                        console.log("test");
                        (txn as SlpTxnDetailsResult).tokenNftParentId = await this.getNftParentId((txn  as SlpTxnDetailsResult).tokenInfo.tokenIdHex);
                    }
                }
                return txns as SlpTxnDetailsResult[];
            }
            count++;
            if (count > retries) {
                throw new Error("gRPC client.getTransaction endpoint experienced a problem");
            }
            await sleep(250);
        }
    }

    public async getAddressDetailsWithRetry(address: string, retries = 40) {
        // must be a cash or legacy addr
        if (!bchaddr.isCashAddress(address) && !bchaddr.isLegacyAddress(address)) {
            throw new Error("Not an a valid address format, must be cashAddr or Legacy address format.");
        }
        const utxos = (await this.client.getAddressUtxos({ address, includeMempool: false })).getOutputsList();
        const balance = utxos.reduce((p: any, o: { getValue: () => any; }) => o.getValue(), 0);
        const utxosMempool = (await this.client.getAddressUtxos({ address, includeMempool: true })).getOutputsList();
        const mempoolBalance = utxosMempool.reduce((p: any, o: { getValue: () => any; }) => o.getValue(), 0);
        return {
            balance,
            balanceSat: balance * 10 ** 8,
            totalReceived: null,
            totalReceivedSat: null,
            totalSent: null,
            totalSentSat: null,
            unconfirmedBalance: mempoolBalance - balance,
            unconfirmedBalanceSat: mempoolBalance * 10 ** 8 - balance * 10 ** 8,
            unconfirmedTxApperances: null,
            txApperances: null,
            transactions: null,
            legacyAddress: bchaddr.toLegacyAddress(address),
            cashAddress: bchaddr.toCashAddress(address),
            slpAddress: bchaddr.toSlpAddress(address),
        } as any as AddressDetailsResult;
    }

    public async sendTx(hex: string): Promise<string> {
        const res = await this.client.submitTransaction({ txnHex: hex });
        return Buffer.from(res.getHash_asU8().reverse()).toString("hex");
    }

    public async monitorForPayment(paymentAddress: string, fee: number, onPaymentCB: Function): Promise<void> {
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

    public async processUtxosForSlp(utxos: SlpAddressUtxoResult[]): Promise<SlpBalancesResult> {
        return await this.slp.processUtxosForSlpAbstract(utxos, this);
    }

    public async getRawTransactions(txids: string[]): Promise<string[]> {
        if (this.validator && this.validator.getRawTransactions) {
            return await this.validator.getRawTransactions(txids);
        }
        const getTxnHex = async (txid: string) => {
            return Buffer.from((await this.client
                                .getRawTransaction({ hash: txid, reversedHashOrder: true }))
                                .getTransaction_asU8()).toString("hex");
        };
        return await Promise.all(txids.map((txid) => getTxnHex(txid)));
    }

    public async isValidSlpTxid(txid: string): Promise<boolean> {
        return await this.validator.isValidSlpTxid(txid, null, null, this.logger);
    }

    public async validateSlpTransactions(txids: string[]): Promise<string[]> {
        return await this.validator.validateSlpTransactions(txids);
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
}
