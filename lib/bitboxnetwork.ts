import { SlpAddressUtxoResult, SlpTransactionDetails, utxo } from "../index";
import { Slp, SlpProxyValidator, SlpValidator } from "./slp";
import { Utils } from "./utils";

import BITBOX from "bitbox-sdk/lib/bitbox-sdk";
import {
  AddressUtxoResult,
  AddressDetailsResult
} from "bitbox-sdk/lib/Address";
import { TxnDetails } from "bitbox-sdk/lib/Transaction";
import BigNumber from "bignumber.js";
import * as _ from "lodash";
import * as bchaddr from "bchaddrjs-slp";
import * as Bitcore from "bitcore-lib-cash";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class BitboxNetwork implements SlpValidator {
  BITBOX: BITBOX;
  slp: Slp;
  validator: SlpValidator;

  constructor(BITBOX: BITBOX, validator: SlpValidator | SlpProxyValidator) {
    if (!BITBOX)
      throw Error("Must provide BITBOX instance to class constructor.");
    if (!validator)
      throw Error("Must provide validator instance to class constructor.");
    this.BITBOX = BITBOX;
    this.slp = new Slp(BITBOX);
    this.validator = validator;
  }

  async getTokenInformation(txid: string): Promise<SlpTransactionDetails> {
    let txhex: string = (await this.BITBOX.RawTransactions.getRawTransaction([
      txid
    ]))[0];
    let txn: Bitcore.Transaction = new Bitcore.Transaction(txhex);
    return this.slp.parseSlpOutputScript(txn.outputs[0]._scriptBuffer);
  }

  async getTransactionDetails(txid: string) {
    let txn: any = (await this.BITBOX.Transaction.details([txid]))[0];
    try {
      txn.tokenInfo = await this.getTokenInformation(txid);
      txn.tokenIsValid = await this.validator.isValidSlpTxid(txid);
    } catch (_) {
      txn.tokenInfo = null;
      txn.tokenIsValid = false;
    }
    return txn;
  }

  async getUtxos(address: string) {
    // must be a cash or legacy addr
    let res: AddressUtxoResult;
    if (!bchaddr.isCashAddress(address) && !bchaddr.isLegacyAddress(address))
      throw new Error(
        "Not an a valid address format, must be cashAddr or Legacy address format."
      );
    res = (await this.BITBOX.Address.utxo([address]))[0];
    return res;
  }

  async getAllSlpBalancesAndUtxos(address: string) {
    address = bchaddr.toCashAddress(address);
    let result = await this.getUtxoWithTxDetails(address);
    return await this.processUtxosForSlp(result);
  }

  // Sent SLP tokens to a single output address with change handled (Warning: Sweeps all BCH/SLP UTXOs for the funding address)
  async simpleTokenSend(
    tokenId: string,
    sendAmount: BigNumber,
    inputUtxos: SlpAddressUtxoResult[],
    tokenReceiverAddress: string,
    changeReceiverAddress: string
  ) {
    // 1) Set the token send amounts, we'll send 100 tokens to a new receiver and send token change back to the sender
    let totalTokenInputAmount: BigNumber = inputUtxos
      .filter(txo => {
        return Slp.preSendSlpJudgementCheck(txo, tokenId);
      })
      .reduce((tot: BigNumber, txo: SlpAddressUtxoResult) => {
        return tot.plus(txo.slpUtxoJudgementAmount);
      }, new BigNumber(0));

    // 2) Compute the token Change amount.
    let tokenChangeAmount: BigNumber = totalTokenInputAmount.minus(sendAmount);

    let txHex;
    if (tokenChangeAmount.isGreaterThan(new BigNumber(0))) {
      // 3) Create the Send OP_RETURN message
      let sendOpReturn = this.slp.buildSendOpReturn({
        tokenIdHex: tokenId,
        outputQtyArray: [sendAmount, tokenChangeAmount]
      });
      // 4) Create the raw Send transaction hex
      txHex = this.slp.buildRawSendTx({
        slpSendOpReturn: sendOpReturn,
        input_token_utxos: Utils.mapToUtxoArray(inputUtxos),
        tokenReceiverAddressArray: [
          tokenReceiverAddress,
          changeReceiverAddress
        ],
        bchChangeReceiverAddress: changeReceiverAddress
      });
    } else if (tokenChangeAmount.isEqualTo(new BigNumber(0))) {
      // 3) Create the Send OP_RETURN message
      let sendOpReturn = this.slp.buildSendOpReturn({
        tokenIdHex: tokenId,
        outputQtyArray: [sendAmount]
      });
      // 4) Create the raw Send transaction hex
      txHex = this.slp.buildRawSendTx({
        slpSendOpReturn: sendOpReturn,
        input_token_utxos: Utils.mapToUtxoArray(inputUtxos),
        tokenReceiverAddressArray: [tokenReceiverAddress],
        bchChangeReceiverAddress: changeReceiverAddress
      });
    } else {
      throw Error("Token inputs less than the token outputs");
    }

    // 5) Broadcast the transaction over the network using this.BITBOX
    return await this.sendTx(txHex);
  }

  async simpleTokenGenesis(
    tokenName: string,
    tokenTicker: string,
    tokenAmount: BigNumber,
    documentUri: string,
    documentHash: Buffer | null,
    decimals: number,
    tokenReceiverAddress: string,
    batonReceiverAddress: string | null,
    bchChangeReceiverAddress: string,
    inputUtxos: SlpAddressUtxoResult[]
  ) {
    let genesisOpReturn = this.slp.buildGenesisOpReturn({
      ticker: tokenTicker,
      name: tokenName,
      documentUri: documentUri,
      hash: documentHash,
      decimals: decimals,
      batonVout: batonReceiverAddress ? 2 : null,
      initialQuantity: tokenAmount
    });

    // 4) Create/sign the raw transaction hex for Genesis
    let genesisTxHex = this.slp.buildRawGenesisTx({
      slpGenesisOpReturn: genesisOpReturn,
      mintReceiverAddress: tokenReceiverAddress,
      batonReceiverAddress: batonReceiverAddress,
      bchChangeReceiverAddress: bchChangeReceiverAddress,
      input_utxos: Utils.mapToUtxoArray(inputUtxos)
    });

    return await this.sendTx(genesisTxHex);
  }

  // Sent SLP tokens to a single output address with change handled (Warning: Sweeps all BCH/SLP UTXOs for the funding address)
  async simpleTokenMint(
    tokenId: string,
    mintAmount: BigNumber,
    inputUtxos: SlpAddressUtxoResult[],
    tokenReceiverAddress: string,
    batonReceiverAddress: string,
    changeReceiverAddress: string
  ) {
    // // convert address to cashAddr from SLP format.
    // let fundingAddress_cashfmt = bchaddr.toCashAddress(fundingAddress);

    // 1) Create the Send OP_RETURN message
    let mintOpReturn = this.slp.buildMintOpReturn({
      tokenIdHex: tokenId,
      mintQuantity: mintAmount,
      batonVout: 2
    });

    // 2) Create the raw Mint transaction hex
    let txHex = this.slp.buildRawMintTx({
      input_baton_utxos: Utils.mapToUtxoArray(inputUtxos),
      slpMintOpReturn: mintOpReturn,
      mintReceiverAddress: tokenReceiverAddress,
      batonReceiverAddress: batonReceiverAddress,
      bchChangeReceiverAddress: changeReceiverAddress
    });

    //console.log(txHex);

    // 5) Broadcast the transaction over the network using this.BITBOX
    return await this.sendTx(txHex);
  }

  // Burn a precise quantity of SLP tokens with remaining tokens (change) sent to a single output address (Warning: Sweeps all BCH/SLP UTXOs for the funding address)
  async simpleTokenBurn(
    tokenId: string,
    burnAmount: BigNumber,
    inputUtxos: SlpAddressUtxoResult[],
    changeReceiverAddress: string
  ) {
    // Set the token send amounts, we'll send 100 tokens to a new receiver and send token change back to the sender
    let totalTokenInputAmount: BigNumber = inputUtxos
      .filter(txo => {
        return Slp.preSendSlpJudgementCheck(txo, tokenId);
      })
      .reduce((tot: BigNumber, txo: SlpAddressUtxoResult) => {
        return tot.plus(txo.slpUtxoJudgementAmount);
      }, new BigNumber(0));

    // Compute the token Change amount.
    let tokenChangeAmount: BigNumber = totalTokenInputAmount.minus(burnAmount);

    let txHex;
    if (tokenChangeAmount.isGreaterThan(new BigNumber(0))) {
      // Create the Send OP_RETURN message
      let sendOpReturn = this.slp.buildSendOpReturn({
        tokenIdHex: tokenId,
        outputQtyArray: [tokenChangeAmount]
      });
      // Create the raw Send transaction hex
      txHex = this.slp.buildRawBurnTx(burnAmount, {
        slpBurnOpReturn: sendOpReturn,
        input_token_utxos: Utils.mapToUtxoArray(inputUtxos),
        bchChangeReceiverAddress: changeReceiverAddress
      });
    } else if (tokenChangeAmount.isLessThanOrEqualTo(new BigNumber(0))) {
      // Create the raw Send transaction hex
      txHex = this.slp.buildRawBurnTx(burnAmount, {
        tokenIdHex: tokenId,
        input_token_utxos: Utils.mapToUtxoArray(inputUtxos),
        bchChangeReceiverAddress: changeReceiverAddress
      });
    } else {
      throw Error("Token inputs less than the token outputs");
    }

    // Broadcast the transaction over the network using this.BITBOX
    return await this.sendTx(txHex);
  }

  async getUtxoWithRetry(address: string, retries = 40) {
    let result: AddressUtxoResult | undefined;
    let count = 0;
    while (result === undefined) {
      result = await this.getUtxos(address);
      count++;
      if (count > retries)
        throw new Error(
          "this.BITBOX.Address.utxo endpoint experienced a problem"
        );
      await sleep(250);
    }
    return result;
  }

  async getUtxoWithTxDetails(address: string) {
    let utxos = Utils.mapToSlpAddressUtxoResultArray(
      await this.getUtxoWithRetry(address)
    );
    let txIds = utxos.map(i => i.txid);
    if (txIds.length === 0) return [];
    // Split txIds into chunks of 20 (BitBox limit), run the detail queries in parallel
    let txDetails: any[] = await Promise.all(
      _.chunk(txIds, 20).map((txids: string[]) => {
        return this.getTransactionDetailsWithRetry([...new Set(txids)]);
      })
    );
    // concat the chunked arrays
    txDetails = <TxnDetails[]>[].concat(...txDetails);
    utxos = utxos.map(i => {
      i.tx = txDetails.find((d: TxnDetails) => d.txid === i.txid);
      return i;
    });
    return utxos;
  }

  async getTransactionDetailsWithRetry(txids: string[], retries = 40) {
    let result!: TxnDetails[];
    let count = 0;
    while (result === undefined) {
      result = await this.BITBOX.Transaction.details(txids);
      count++;
      if (count > retries)
        throw new Error(
          "this.BITBOX.Address.details endpoint experienced a problem"
        );
      await sleep(500);
    }
    return result;
  }

  async getAddressDetailsWithRetry(address: string, retries = 40) {
    // must be a cash or legacy addr
    if (!bchaddr.isCashAddress(address) && !bchaddr.isLegacyAddress(address))
      throw new Error(
        "Not an a valid address format, must be cashAddr or Legacy address format."
      );
    let result: AddressDetailsResult[] | undefined;
    let count = 0;
    while (result === undefined) {
      result = await this.BITBOX.Address.details([address]);
      count++;
      if (count > retries)
        throw new Error(
          "this.BITBOX.Address.details endpoint experienced a problem"
        );

      await sleep(250);
    }
    return result;
  }

  async sendTx(hex: string) {
    let res = await this.BITBOX.RawTransactions.sendRawTransaction(hex);
    //console.log(res);
    return res;
  }

  async monitorForPayment(
    paymentAddress: string,
    fee: number,
    onPaymentCB: Function
  ) {
    let utxo: AddressUtxoResult | undefined;
    // must be a cash or legacy addr
    if (
      !bchaddr.isCashAddress(paymentAddress) &&
      !bchaddr.isLegacyAddress(paymentAddress)
    )
      throw new Error(
        "Not an a valid address format, must be cashAddr or Legacy address format."
      );

    while (true) {
      try {
        utxo = await this.getUtxos(paymentAddress);
        if (utxo) if (utxo.utxos[0].satoshis >= fee) break;
      } catch (ex) {
        console.log(ex);
      }
      await sleep(2000);
    }
    onPaymentCB();
  }

  isValidSlpTxid(txid: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  async getRawTransactions(txids: string[]): Promise<string[]> {
    return await this.validator.getRawTransactions(txids);
  }

  async processUtxosForSlp(utxos: SlpAddressUtxoResult[]) {
    return await this.slp.processUtxosForSlpAbstract(utxos, this.validator);
  }

  async validateSlpTransactions(txids: string[]): Promise<string[]> {
    return await this.validator.validateSlpTransactions(txids);
  }

  // TODO change is here
  async p2msTokenGenesis(
    tokenName: string,
    tokenTicker: string,
    tokenAmount: BigNumber,
    documentUri: string,
    documentHash: Buffer | null,
    decimals: number,
    tokenReceiverWifs: string[],
    batonReceiverWifs: string[],
    bchChangeReceiverWifs: string[],
    inputUtxos: SlpAddressUtxoResult[],
    requiredSignatures: number
  ) {
    // Create Genesis OP_RETURN
    let genesisOpReturn = this.slp.buildGenesisOpReturn({
      ticker: tokenTicker,
      name: tokenName,
      documentUri: documentUri,
      hash: documentHash,
      decimals: decimals,
      batonVout: batonReceiverWifs && batonReceiverWifs[0] ? 2 : null,
      initialQuantity: tokenAmount
    });

    // Create/sign the raw transaction hex for Genesis
    let genesisTxP2MSHex = this.slp.buildRawGenesisP2MSTx({
      slpGenesisOpReturn: genesisOpReturn,
      mintReceiverWifs: tokenReceiverWifs,
      batonReceiverWifs: batonReceiverWifs,
      bchChangeReceiverWifs: bchChangeReceiverWifs,
      input_utxos: Utils.mapToUtxoArray(inputUtxos),
      requiredSignatures: requiredSignatures
    });

    return await this.sendTx(genesisTxP2MSHex);
  }

  async p2msTokenMint(
    tokenId: string,
    mintAmount: BigNumber,
    inputUtxos: SlpAddressUtxoResult[],
    fundingWif: string,
    tokenReceiverWifs: string[],
    batonReceiverWifs: string[],
    bchChangeReceiverWifs: string[],
    requiredSignatures: number
  ) {
    // // convert address to cashAddr from SLP format.
    // let fundingAddress_cashfmt = bchaddr.toCashAddress(fundingAddress);

    // 1) Create the Send OP_RETURN message
    let mintOpReturn = this.slp.buildMintOpReturn({
      tokenIdHex: tokenId,
      mintQuantity: mintAmount,
      batonVout: 2
    });

    // 2) Create the raw Mint transaction hex
    let txHex = this.slp.buildRawMintP2MSTx({
      input_baton_utxos: Utils.mapToUtxoArray(inputUtxos),
      slpMintOpReturn: mintOpReturn,
      fundingWif: fundingWif,
      mintReceiverWifs: tokenReceiverWifs,
      batonReceiverWifs: batonReceiverWifs,
      bchChangeReceiverWifs: bchChangeReceiverWifs,
      requiredSignatures: requiredSignatures
    });

    // 5) Broadcast the transaction over the network using this.BITBOX
    return await this.sendTx(txHex);
  }

  async p2msTokenSend(
    fundingWif: string,
    tokenId: string,
    sendAmount: BigNumber,
    inputUtxos: utxo[],
    tokenReceiverWifs: string[],
    bchChangeReceiverWifs: string[],
    requiredSignatures: number
  ) {
    // 1) Set the token send amounts, we'll send 100 tokens to a new receiver and send token change back to the sender
    let totalTokenInputAmount: BigNumber = new BigNumber(1);

    // 2) Compute the token Change amount.
    let tokenChangeAmount: BigNumber = new BigNumber(10);

    let txHex;
    let sendOpReturn = this.slp.buildSendOpReturn({
      tokenIdHex: tokenId,
      outputQtyArray: [sendAmount, tokenChangeAmount]
    });
    // 4) Create the raw Send transaction hex
    txHex = this.slp.buildRawSendP2MSTx({
      fundingWif: fundingWif,
      slpSendOpReturn: sendOpReturn,
      // input_token_utxos: Utils.mapToUtxoArray(inputUtxos),
      input_token_utxos: inputUtxos,
      tokenReceiverWifs: tokenReceiverWifs,
      bchChangeReceiverWifs: bchChangeReceiverWifs,
      requiredSignatures: requiredSignatures
    });
    // if (tokenChangeAmount.isGreaterThan(new BigNumber(0))) {
    //   // 3) Create the Send OP_RETURN message
    //   let sendOpReturn = this.slp.buildSendOpReturn({
    //     tokenIdHex: tokenId,
    //     outputQtyArray: [sendAmount, tokenChangeAmount]
    //   });
    //   // 4) Create the raw Send transaction hex
    //   txHex = this.slp.buildRawSendP2MSTx({
    //     slpSendOpReturn: sendOpReturn,
    //     // input_token_utxos: Utils.mapToUtxoArray(inputUtxos),
    //     input_token_utxos: inputUtxos,
    //     tokenReceiverWifs: tokenReceiverWifs,
    //     bchChangeReceiverWifs: bchChangeReceiverWifs,
    //     requiredSignatures: requiredSignatures
    //   });
    // } else if (tokenChangeAmount.isEqualTo(new BigNumber(0))) {
    //   // 3) Create the Send OP_RETURN message
    //   let sendOpReturn = this.slp.buildSendOpReturn({
    //     tokenIdHex: tokenId,
    //     outputQtyArray: [sendAmount]
    //   });
    //   // 4) Create the raw Send transaction hex
    //   txHex = this.slp.buildRawSendTx({
    //     slpSendOpReturn: sendOpReturn,
    //     input_token_utxos: Utils.mapToUtxoArray(inputUtxos),
    //     tokenReceiverAddressArray: [tokenReceiverAddress],
    //     bchChangeReceiverAddress: changeReceiverAddress
    //   });
    // } else {
    //   throw Error("Token inputs less than the token outputs");
    // }

    // 5) Broadcast the transaction over the network using this.BITBOX
    return await this.sendTx(txHex);
  }

  async p2msTokenBurn(
    fundingWif: string,
    tokenId: string,
    burnAmount: BigNumber,
    inputUtxos: SlpAddressUtxoResult[],
    bchChangeReceiverWifs: string[],
    requiredSignatures: number
  ) {
    // Set the token send amounts, we'll send 100 tokens to a new receiver and send token change back to the sender
    let totalTokenInputAmount: BigNumber = new BigNumber(100);
    // let totalTokenInputAmount: BigNumber = inputUtxos
    //   .filter(txo => {
    //     return Slp.preSendSlpJudgementCheck(txo, tokenId);
    //   })
    //   .reduce((tot: BigNumber, txo: SlpAddressUtxoResult) => {
    //     return tot.plus(txo.slpUtxoJudgementAmount);
    //   }, new BigNumber(0));

    // Compute the token Change amount.
    let tokenChangeAmount: BigNumber = totalTokenInputAmount.minus(burnAmount);

    let bchChangeReceiverAddresses: string[] = bchChangeReceiverWifs.map(
      wif => {
        let ecpair = this.BITBOX.ECPair.fromWIF(wif);
        let cashAddr = this.BITBOX.ECPair.toCashAddress(ecpair);
        return bchaddr.toSlpAddress(cashAddr);
      }
    );

    bchChangeReceiverAddresses.forEach(outputAddress => {
      if (!bchaddr.isSlpAddress(outputAddress))
        throw new Error("Change receiver address not in SLP format.");
    });

    let txHex;
    if (tokenChangeAmount.isGreaterThan(new BigNumber(0))) {
      // Create the Send OP_RETURN message
      let sendOpReturn = this.slp.buildSendOpReturn({
        tokenIdHex: tokenId,
        outputQtyArray: [tokenChangeAmount]
      });
      // Create the raw Send transaction hex
      txHex = this.slp.buildRawBurnP2MSTx(burnAmount, {
        slpBurnOpReturn: sendOpReturn,
        input_token_utxos: Utils.mapToUtxoArray(inputUtxos),
        bchChangeReceiverAddress: bchChangeReceiverAddresses[0],
        bchChangeReceiverWifs: bchChangeReceiverWifs,
        requiredSignatures: requiredSignatures
      });
    } else if (tokenChangeAmount.isLessThanOrEqualTo(new BigNumber(0))) {
      // Create the raw Send transaction hex
      txHex = this.slp.buildRawBurnP2MSTx(burnAmount, {
        tokenIdHex: tokenId,
        input_token_utxos: Utils.mapToUtxoArray(inputUtxos),
        bchChangeReceiverAddress: bchChangeReceiverAddresses[0],
        bchChangeReceiverWifs: bchChangeReceiverWifs,
        requiredSignatures: requiredSignatures
      });
    } else {
      throw Error("Token inputs less than the token outputs");
    }

    // Broadcast the transaction over the network using this.BITBOX
    return await this.sendTx(txHex);
  }

  async p2pkTokenGenesis(
    tokenName: string,
    tokenTicker: string,
    tokenAmount: BigNumber,
    documentUri: string,
    documentHash: Buffer | null,
    decimals: number,
    tokenReceiverWif: string,
    batonReceiverWif: string | null,
    bchChangeReceiverWif: string,
    inputUtxos: SlpAddressUtxoResult[]
  ) {
    // Create Genesis OP_RETURN
    let genesisOpReturn = this.slp.buildGenesisOpReturn({
      ticker: tokenTicker,
      name: tokenName,
      documentUri: documentUri,
      hash: documentHash,
      decimals: decimals,
      batonVout: batonReceiverWif ? 2 : null,
      initialQuantity: tokenAmount
    });

    // Create/sign the raw transaction hex for Genesis
    let genesisTxP2PKHex = this.slp.buildRawGenesisP2PKTx({
      slpGenesisOpReturn: genesisOpReturn,
      mintReceiverWif: tokenReceiverWif,
      batonReceiverWif: batonReceiverWif,
      bchChangeReceiverWif: bchChangeReceiverWif,
      input_utxos: Utils.mapToUtxoArray(inputUtxos)
    });

    return await this.sendTx(genesisTxP2PKHex);
  }

  async p2pkTokenMint(
    tokenId: string,
    mintAmount: BigNumber,
    inputUtxos: SlpAddressUtxoResult[],
    fundingWif: string,
    tokenReceiverWif: string,
    batonReceiverWif: string,
    bchChangeReceiverWif: string
  ) {
    // // convert address to cashAddr from SLP format.
    // let fundingAddress_cashfmt = bchaddr.toCashAddress(fundingAddress);

    // 1) Create the Send OP_RETURN message
    let mintOpReturn = this.slp.buildMintOpReturn({
      tokenIdHex: tokenId,
      mintQuantity: mintAmount,
      batonVout: 2
    });

    // 2) Create the raw Mint transaction hex
    let txHex = this.slp.buildRawMintP2PKTx({
      input_baton_utxos: Utils.mapToUtxoArray(inputUtxos),
      slpMintOpReturn: mintOpReturn,
      fundingWif: fundingWif,
      mintReceiverWif: tokenReceiverWif,
      batonReceiverWif: batonReceiverWif,
      bchChangeReceiverWif: bchChangeReceiverWif
    });

    // 5) Broadcast the transaction over the network using this.BITBOX
    return await this.sendTx(txHex);
  }

  async p2pkTokenSend(
    fundingWif: string,
    tokenId: string,
    sendAmount: BigNumber,
    inputUtxos: utxo[],
    tokenReceiverWif: string,
    bchChangeReceiverWif: string
  ) {
    // 1) Set the token send amounts, we'll send 100 tokens to a new receiver and send token change back to the sender
    let totalTokenInputAmount: BigNumber = new BigNumber(1);

    // 2) Compute the token Change amount.
    let tokenChangeAmount: BigNumber = new BigNumber(10);

    let txHex;
    let sendOpReturn = this.slp.buildSendOpReturn({
      tokenIdHex: tokenId,
      outputQtyArray: [sendAmount, tokenChangeAmount]
    });
    // 4) Create the raw Send transaction hex
    txHex = this.slp.buildRawSendP2PKTx({
      fundingWif: fundingWif,
      slpSendOpReturn: sendOpReturn,
      // input_token_utxos: Utils.mapToUtxoArray(inputUtxos),
      input_token_utxos: inputUtxos,
      tokenReceiverWif: tokenReceiverWif,
      bchChangeReceiverWif: bchChangeReceiverWif
    });
    // if (tokenChangeAmount.isGreaterThan(new BigNumber(0))) {
    //   // 3) Create the Send OP_RETURN message
    //   let sendOpReturn = this.slp.buildSendOpReturn({
    //     tokenIdHex: tokenId,
    //     outputQtyArray: [sendAmount, tokenChangeAmount]
    //   });
    //   // 4) Create the raw Send transaction hex
    //   txHex = this.slp.buildRawSendP2MSTx({
    //     slpSendOpReturn: sendOpReturn,
    //     // input_token_utxos: Utils.mapToUtxoArray(inputUtxos),
    //     input_token_utxos: inputUtxos,
    //     tokenReceiverWifs: tokenReceiverWifs,
    //     bchChangeReceiverWifs: bchChangeReceiverWifs,
    //     requiredSignatures: requiredSignatures
    //   });
    // } else if (tokenChangeAmount.isEqualTo(new BigNumber(0))) {
    //   // 3) Create the Send OP_RETURN message
    //   let sendOpReturn = this.slp.buildSendOpReturn({
    //     tokenIdHex: tokenId,
    //     outputQtyArray: [sendAmount]
    //   });
    //   // 4) Create the raw Send transaction hex
    //   txHex = this.slp.buildRawSendTx({
    //     slpSendOpReturn: sendOpReturn,
    //     input_token_utxos: Utils.mapToUtxoArray(inputUtxos),
    //     tokenReceiverAddressArray: [tokenReceiverAddress],
    //     bchChangeReceiverAddress: changeReceiverAddress
    //   });
    // } else {
    //   throw Error("Token inputs less than the token outputs");
    // }

    // 5) Broadcast the transaction over the network using this.BITBOX
    return await this.sendTx(txHex);
  }

  async p2pkTokenBurn(
    fundingWif: string,
    tokenId: string,
    burnAmount: BigNumber,
    inputUtxos: SlpAddressUtxoResult[],
    bchChangeReceiverWif: string
  ) {
    // Set the token send amounts, we'll send 100 tokens to a new receiver and send token change back to the sender
    let totalTokenInputAmount: BigNumber = new BigNumber(100);
    // let totalTokenInputAmount: BigNumber = inputUtxos
    //   .filter(txo => {
    //     return Slp.preSendSlpJudgementCheck(txo, tokenId);
    //   })
    //   .reduce((tot: BigNumber, txo: SlpAddressUtxoResult) => {
    //     return tot.plus(txo.slpUtxoJudgementAmount);
    //   }, new BigNumber(0));

    // Compute the token Change amount.
    let tokenChangeAmount: BigNumber = totalTokenInputAmount.minus(burnAmount);

    let bchChangeReceiverECPair = this.BITBOX.ECPair.fromWIF(
      bchChangeReceiverWif
    );
    let bchChangeReceiveCashAddr = this.BITBOX.ECPair.toCashAddress(
      bchChangeReceiverECPair
    );
    let bchChangeReceiverAddress: string = bchaddr.toSlpAddress(
      bchChangeReceiveCashAddr
    );

    if (!bchaddr.isSlpAddress(bchChangeReceiverAddress))
      throw new Error("Change receiver address not in SLP format.");

    let txHex;
    if (tokenChangeAmount.isGreaterThan(new BigNumber(0))) {
      // Create the Send OP_RETURN message
      let sendOpReturn = this.slp.buildSendOpReturn({
        tokenIdHex: tokenId,
        outputQtyArray: [tokenChangeAmount]
      });
      // Create the raw Send transaction hex
      txHex = this.slp.buildRawBurnP2PKTx(burnAmount, {
        slpBurnOpReturn: sendOpReturn,
        input_token_utxos: Utils.mapToUtxoArray(inputUtxos),
        bchChangeReceiverAddress: bchChangeReceiverAddress,
        bchChangeReceiverWif: bchChangeReceiverWif
      });
    } else if (tokenChangeAmount.isLessThanOrEqualTo(new BigNumber(0))) {
      // Create the raw Send transaction hex
      txHex = this.slp.buildRawBurnP2PKTx(burnAmount, {
        tokenIdHex: tokenId,
        input_token_utxos: Utils.mapToUtxoArray(inputUtxos),
        bchChangeReceiverAddress: bchChangeReceiverAddress,
        bchChangeReceiverWif: bchChangeReceiverWif
      });
    } else {
      throw Error("Token inputs less than the token outputs");
    }

    // Broadcast the transaction over the network using this.BITBOX
    return await this.sendTx(txHex);
  }

  async p2shTokenGenesis(
    tokenName: string,
    tokenTicker: string,
    tokenAmount: BigNumber,
    documentUri: string,
    documentHash: Buffer | null,
    decimals: number,
    tokenReceiverWif: string,
    batonReceiverWif: string | null,
    bchChangeReceiverWif: string,
    inputUtxos: SlpAddressUtxoResult[]
  ) {
    // Create Genesis OP_RETURN
    let genesisOpReturn = this.slp.buildGenesisOpReturn({
      ticker: tokenTicker,
      name: tokenName,
      documentUri: documentUri,
      hash: documentHash,
      decimals: decimals,
      batonVout: batonReceiverWif ? 2 : null,
      initialQuantity: tokenAmount
    });

    // Create/sign the raw transaction hex for Genesis
    let genesisTxP2SHHex = this.slp.buildRawGenesisP2SHTx({
      slpGenesisOpReturn: genesisOpReturn,
      mintReceiverWif: tokenReceiverWif,
      batonReceiverWif: batonReceiverWif,
      bchChangeReceiverWif: bchChangeReceiverWif,
      input_utxos: Utils.mapToUtxoArray(inputUtxos)
    });

    return await this.sendTx(genesisTxP2SHHex);
  }

  async p2shTokenMint(
    tokenId: string,
    mintAmount: BigNumber,
    inputUtxos: SlpAddressUtxoResult[],
    fundingWif: string,
    tokenReceiverWif: string,
    batonReceiverWif: string,
    bchChangeReceiverWif: string
  ) {
    // // convert address to cashAddr from SLP format.
    // let fundingAddress_cashfmt = bchaddr.toCashAddress(fundingAddress);

    // 1) Create the Send OP_RETURN message
    let mintOpReturn = this.slp.buildMintOpReturn({
      tokenIdHex: tokenId,
      mintQuantity: mintAmount,
      batonVout: 2
    });

    // 2) Create the raw Mint transaction hex
    let txHex = this.slp.buildRawMintP2SHTx({
      input_baton_utxos: Utils.mapToUtxoArray(inputUtxos),
      slpMintOpReturn: mintOpReturn,
      fundingWif: fundingWif,
      mintReceiverWif: tokenReceiverWif,
      batonReceiverWif: batonReceiverWif,
      bchChangeReceiverWif: bchChangeReceiverWif
    });

    // 5) Broadcast the transaction over the network using this.BITBOX
    return await this.sendTx(txHex);
  }
}
