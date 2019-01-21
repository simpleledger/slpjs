"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bchaddrjs_1 = require("bchaddrjs");
const bignumber_js_1 = require("bignumber.js");
const __1 = require("..");
let slptokentype1 = require('./slptokentype1');
class Slp {
    constructor(BITBOX) {
        this.BITBOX = BITBOX;
    }
    get lokadIdHex() { return "534c5000"; }
    buildGenesisOpReturn(config, type = 0x01) {
        // Example config:
        // let config = {
        //     ticker: "", 
        //     name: "",
        //     urlOrEmail: "", 
        //     hash: null,
        //     decimals: 0, 
        //     batonVout: 2, // normally this is null (for fixed supply) or 2 for flexible
        //     initialQuantity: 1000000
        // }
        return slptokentype1.buildGenesisOpReturn(config.ticker, config.name, config.urlOrEmail, config.hash, config.decimals, config.batonVout, config.initialQuantity);
    }
    buildSendOpReturn(config, type = 0x01) {
        // Example config:
        // let config = {
        //     tokenIdHex: "", 
        //     outputQtyArray: []
        // }
        return slptokentype1.buildSendOpReturn(config.tokenIdHex, config.outputQtyArray);
    }
    buildRawGenesisTx(config, type = 0x01) {
        // Example config: 
        // let config = {
        //     slpGenesisOpReturn: genesisOpReturn, 
        //     mintReceiverAddress: this.slpAddress,
        //     mintReceiverSatoshis: config.utxo_satoshis - slp.calculateGenesisFee(batonAddress) + 546
        //     batonReceiverAddress: batonAddress,
        //     batonReceiverSatoshis: 546,
        //     bchChangeReceiverAddress: null,
        //     input_utxos: [{
        //          txid: utxo.txid,
        //          vout: utxo.vout,
        //          satoshis: utxo.satoshis,
        //          wif: wif
        //     }]
        //   }
        // Check for slp format addresses
        if (!bchaddrjs_1.default.isSlpAddress(config.mintReceiverAddress)) {
            throw new Error("Not an SLP address.");
        }
        if (config.batonReceiverAddress != null && !bchaddrjs_1.default.isSlpAddress(config.batonReceiverAddress)) {
            throw new Error("Not an SLP address.");
        }
        config.mintReceiverAddress = bchaddrjs_1.default.toCashAddress(config.mintReceiverAddress);
        // TODO: Check for fee too large or send leftover to target address
        let transactionBuilder = new this.BITBOX.TransactionBuilder('bitcoincash');
        let satoshis = 0;
        config.input_utxos.forEach(token_utxo => {
            transactionBuilder.addInput(token_utxo.txid, token_utxo.vout);
            satoshis += token_utxo.satoshis;
        });
        let genesisCost = this.calculateGenesisCost(config.slpGenesisOpReturn.length, config.input_utxos.length, config.batonReceiverAddress, config.bchChangeReceiverAddress);
        let bchChangeAfterFeeSatoshis = satoshis - genesisCost;
        // Genesis OpReturn
        transactionBuilder.addOutput(config.slpGenesisOpReturn, 0);
        // Genesis token mint
        transactionBuilder.addOutput(config.mintReceiverAddress, config.mintReceiverSatoshis);
        //bchChangeAfterFeeSatoshis -= config.mintReceiverSatoshis;
        // Baton address (optional)
        if (config.batonReceiverAddress != null) {
            config.batonReceiverAddress = bchaddrjs_1.default.toCashAddress(config.batonReceiverAddress);
            transactionBuilder.addOutput(config.batonReceiverAddress, config.batonReceiverSatoshis);
            //bchChangeAfterFeeSatoshis -= config.batonReceiverSatoshis;
        }
        // Change (optional)
        if (config.bchChangeReceiverAddress != null && bchChangeAfterFeeSatoshis >= 546) {
            config.bchChangeReceiverAddress = bchaddrjs_1.default.toCashAddress(config.bchChangeReceiverAddress);
            transactionBuilder.addOutput(config.bchChangeReceiverAddress, bchChangeAfterFeeSatoshis);
        }
        // sign inputs
        let i = 0;
        for (const txo of config.input_utxos) {
            let paymentKeyPair = this.BITBOX.ECPair.fromWIF(txo.wif);
            transactionBuilder.sign(i, paymentKeyPair, null, transactionBuilder.hashTypes.SIGHASH_ALL, txo.satoshis);
            i++;
        }
        return transactionBuilder.build().toHex();
    }
    buildRawSendTx(config, type = 0x01) {
        // Example config: 
        // let config = {
        //     slpSendOpReturn: sendOpReturn,
        //     input_token_utxos: [ 
        //       { 
        //         txid: genesisTxid,
        //         vout: 1,
        //         satoshis: genesisTxData.satoshis,
        //         wif: fundingWif 
        //       }
        //     ],
        //     tokenReceiverAddressArray: outputAddressArray,
        //     bchChangeReceiverAddress: this.state.paymentAddress
        //   }      
        let transactionBuilder = new this.BITBOX.TransactionBuilder('bitcoincash');
        let inputSatoshis = 0;
        config.input_token_utxos.forEach(token_utxo => {
            transactionBuilder.addInput(token_utxo.txid, token_utxo.vout);
            inputSatoshis += token_utxo.satoshis;
        });
        let sendCost = this.calculateSendCost(config.slpSendOpReturn.length, config.input_token_utxos.length, config.tokenReceiverAddressArray.length, config.bchChangeReceiverAddress);
        let bchChangeAfterFeeSatoshis = inputSatoshis - sendCost;
        // Genesis OpReturn
        transactionBuilder.addOutput(config.slpSendOpReturn, 0);
        // Token distribution outputs
        config.tokenReceiverAddressArray.forEach((outputAddress) => {
            // Check for slp format addresses
            if (!bchaddrjs_1.default.isSlpAddress(outputAddress)) {
                throw new Error("Not an SLP address.");
            }
            outputAddress = bchaddrjs_1.default.toCashAddress(outputAddress);
            transactionBuilder.addOutput(outputAddress, 546);
        });
        // Change
        if (config.bchChangeReceiverAddress != null && bchChangeAfterFeeSatoshis >= 546) {
            config.bchChangeReceiverAddress = bchaddrjs_1.default.toCashAddress(config.bchChangeReceiverAddress);
            transactionBuilder.addOutput(config.bchChangeReceiverAddress, bchChangeAfterFeeSatoshis);
        }
        // sign inputs
        let i = 0;
        for (const txo of config.input_token_utxos) {
            let paymentKeyPair = this.BITBOX.ECPair.fromWIF(txo.wif);
            transactionBuilder.sign(i, paymentKeyPair, null, transactionBuilder.hashTypes.SIGHASH_ALL, txo.satoshis);
            i++;
        }
        return transactionBuilder.build().toHex();
    }
    parseSlpOutputScript(outputScript) {
        let slpMsg = {};
        let chunks;
        try {
            chunks = this.parseOpReturnToChunks(outputScript);
        }
        catch (e) {
            //console.log(e);
            throw Error('Bad OP_RETURN');
        }
        if (chunks.length === 0)
            throw Error('Empty OP_RETURN');
        if (!chunks[0].equals(Buffer.from(this.lokadIdHex, 'hex')))
            throw Error('No SLP');
        if (chunks.length === 1)
            throw Error("Missing token_type");
        // # check if the token version is supported
        slpMsg.type = Slp.parseChunkToInt(chunks[1], 1, 2, true);
        if (slpMsg.type !== __1.TokenType.TokenType1)
            throw Error('Unsupported token type:' + slpMsg.type);
        if (chunks.length === 2)
            throw Error('Missing SLP transaction type');
        try {
            slpMsg.transactionType = __1.TokenTransactionType[chunks[2].toString('ascii')];
        }
        catch (_) {
            throw Error('Bad transaction type');
        }
        if (slpMsg.transactionType === __1.TokenTransactionType.GENESIS) {
            if (chunks.length !== 10)
                throw Error('GENESIS with incorrect number of parameters');
            slpMsg.symbol = chunks[3] ? chunks[3].toString('utf8') : '';
            slpMsg.name = chunks[4] ? chunks[4].toString('utf8') : '';
            slpMsg.documentUri = chunks[5] ? chunks[5].toString('utf8') : '';
            slpMsg.documentSha256 = chunks[6] ? chunks[6] : null;
            if (slpMsg.documentSha256) {
                if (slpMsg.documentSha256.length !== 0 && slpMsg.documentSha256.length !== 32)
                    throw Error('Token document hash is incorrect length');
            }
            slpMsg.decimals = Slp.parseChunkToInt(chunks[7], 1, 1, true);
            if (slpMsg.decimals > 9)
                throw Error('Too many decimals');
            slpMsg.batonVout = chunks[8] ? Slp.parseChunkToInt(chunks[8], 1, 1) : null;
            if (slpMsg.batonVout !== null) {
                if (slpMsg.batonVout < 2)
                    throw Error('Mint baton cannot be on vout=0 or 1');
                slpMsg.baton = true;
            }
            slpMsg.genesisOrMintQuantity = new bignumber_js_1.default(chunks[9].readUInt8(0));
        }
        else if (slpMsg.transactionType === __1.TokenTransactionType.SEND) {
            if (chunks.length < 4)
                throw Error('SEND with too few parameters');
            if (chunks[3].length !== 32)
                throw Error('token_id is wrong length');
            slpMsg.tokenIdHex = chunks[3].toString('hex');
            // # Note that we put an explicit 0 for  ['token_output'][0] since it
            // # corresponds to vout=0, which is the OP_RETURN tx output.
            // # ['token_output'][1] is the first token output given by the SLP
            // # message, i.e., the number listed as `token_output_quantity1` in the
            // # spec, which goes to tx output vout=1.
            slpMsg.sendOutputs = [];
            slpMsg.sendOutputs.push(new bignumber_js_1.default(0));
            chunks.slice(4).forEach(chunk => {
                if (chunk.length !== 8)
                    throw Error('SEND quantities must be 8-bytes each.');
                slpMsg.sendOutputs.push(new bignumber_js_1.default(chunk.readUInt8(0)));
            });
            // # maximum 19 allowed token outputs, plus 1 for the explicit [0] we inserted.
            if (slpMsg.sendOutputs.length < 2)
                throw Error('Missing output amounts');
            if (slpMsg.sendOutputs.length > 20)
                throw Error('More than 19 output amounts');
        }
        else if (slpMsg.transactionType === __1.TokenTransactionType.MINT) {
            if (chunks.length != 6)
                throw Error('MINT with incorrect number of parameters');
            if (chunks[3].length != 32)
                throw Error('token_id is wrong length');
            slpMsg.tokenIdHex = chunks[3].toString('hex');
            slpMsg.batonVout = chunks[4] ? Slp.parseChunkToInt(chunks[4], 1, 1) : null;
            if (slpMsg.batonVout !== null) {
                if (slpMsg.batonVout < 2)
                    throw Error('Mint baton cannot be on vout=0 or 1');
                slpMsg.baton = true;
            }
            slpMsg.genesisOrMintQuantity = new bignumber_js_1.default(chunks[5].readUInt8(0));
        }
        else
            throw Error('Bad transaction type');
        return slpMsg;
    }
    static parseChunkToInt(intBytes, minByteLen, maxByteLen, raise_on_Null = false) {
        // # Parse data as unsigned-big-endian encoded integer.
        // # For empty data different possibilities may occur:
        // #      minByteLen <= 0 : return 0
        // #      raise_on_Null == False and minByteLen > 0: return None
        // #      raise_on_Null == True and minByteLen > 0:  raise SlpInvalidOutputMessage
        if (intBytes.length >= minByteLen && intBytes.length <= maxByteLen)
            return intBytes.readUIntBE(0, intBytes.length);
        if (intBytes.length === 0 && !raise_on_Null)
            return null;
        throw Error('Field has wrong length');
    }
    // get list of data chunks resulting from data push operations
    parseOpReturnToChunks(script, allow_op_0 = false, allow_op_number = false) {
        // """Extract pushed bytes after opreturn. Returns list of bytes() objects,
        // one per push.
        let ops;
        // Strict refusal of non-push opcodes; bad scripts throw OpreturnError."""
        try {
            ops = this.getScriptOperations(script);
        }
        catch (e) {
            //console.log(e);
            throw Error('Script error');
        }
        if (ops[0].opcode != this.BITBOX.Script.opcodes.OP_RETURN)
            throw Error('No OP_RETURN');
        let chunks = [];
        ops.slice(1).forEach(opitem => {
            if (opitem.opcode > this.BITBOX.Script.opcodes.OP_16)
                throw Error("Non-push opcode");
            if (opitem.opcode > this.BITBOX.Script.opcodes.OP_PUSHDATA4) {
                if (opitem.opcode === 80)
                    throw Error('Non-push opcode');
                if (!allow_op_number)
                    throw Error('OP_1NEGATE to OP_16 not allowed');
                if (opitem.opcode === this.BITBOX.Script.opcodes.OP_1NEGATE)
                    opitem.data = Buffer.from([0x81]);
                else // OP_1 - OP_16
                    opitem.data = Buffer.from([opitem.opcode - 80]);
            }
            if (opitem.opcode === this.BITBOX.Script.opcodes.OP_0 && !allow_op_0) {
                throw Error('OP_0 not allowed');
            }
            chunks.push(opitem.data);
        });
        //console.log(chunks);
        return chunks;
    }
    // Get a list of operations with accompanying push data (if a push opcode)
    getScriptOperations(script) {
        let ops = [];
        try {
            let n = 0;
            let dlen;
            while (n < script.length) {
                let op = { opcode: script[n], data: null };
                n += 1;
                if (op.opcode <= this.BITBOX.Script.opcodes.OP_PUSHDATA4) {
                    if (op.opcode < this.BITBOX.Script.opcodes.OP_PUSHDATA1)
                        dlen = op.opcode;
                    else if (op.opcode === this.BITBOX.Script.opcodes.OP_PUSHDATA1) {
                        dlen = script[n];
                        n += 1;
                    }
                    else if (op.opcode === this.BITBOX.Script.opcodes.OP_PUSHDATA2) {
                        dlen = script.slice(n, n + 2).readUIntLE(0, 2);
                        n += 2;
                    }
                    else {
                        dlen = script.slice(n, n + 4).readUIntLE(0, 4);
                        n += 4;
                    }
                    if ((n + dlen) > script.length) {
                        throw Error('IndexError');
                    }
                    if (dlen > 0)
                        op.data = script.slice(n, n + dlen);
                    n += dlen;
                }
                ops.push(op);
            }
        }
        catch (e) {
            //console.log(e);
            throw Error('truncated script');
        }
        return ops;
    }
    calculateGenesisCost(genesisOpReturnLength, inputUtxoSize, batonAddress = null, bchChangeAddress = null, feeRate = 1) {
        let outputs = 1;
        let nonfeeoutputs = 546;
        if (batonAddress != null) {
            nonfeeoutputs += 546;
            outputs += 1;
        }
        if (bchChangeAddress != null) {
            outputs += 1;
        }
        let fee = this.BITBOX.BitcoinCash.getByteCount({ P2PKH: inputUtxoSize }, { P2PKH: outputs });
        fee += genesisOpReturnLength;
        fee += 10; // added to account for OP_RETURN ammount of 0000000000000000
        fee *= feeRate;
        console.log("GENESIS cost before outputs: " + fee.toString());
        fee += nonfeeoutputs;
        console.log("GENESIS cost after outputs are added: " + fee.toString());
        return fee;
    }
    calculateSendCost(sendOpReturnLength, inputUtxoSize, outputAddressArraySize, bchChangeAddress = null, feeRate = 1) {
        let outputs = outputAddressArraySize;
        let nonfeeoutputs = outputAddressArraySize * 546;
        if (bchChangeAddress != null) {
            outputs += 1;
        }
        let fee = this.BITBOX.BitcoinCash.getByteCount({ P2PKH: inputUtxoSize }, { P2PKH: outputs });
        fee += sendOpReturnLength;
        fee += 10; // added to account for OP_RETURN ammount of 0000000000000000
        fee *= feeRate;
        console.log("SEND cost before outputs: " + fee.toString());
        fee += nonfeeoutputs;
        console.log("SEND cost after outputs are added: " + fee.toString());
        return fee;
    }
}
exports.Slp = Slp;
