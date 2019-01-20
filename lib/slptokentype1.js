"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const bignumber_js_1 = require("bignumber.js");
class SlpTokenType1 {
    static get lokadIdHex() { return "534c5000"; }
    static buildGenesisOpReturn(ticker, name, documentUrl, documentHashHex, decimals, batonVout, initialQuantity) {
        let script;
        // OP Return Prefix
        script.push(0x6a);
        // Lokad Id
        let lokadId = Buffer.from(this.lokadIdHex, 'hex');
        script.push(utils_1.Utils.getPushDataOpcode(lokadId));
        lokadId.forEach((item) => script.push(item));
        // Token Type
        let tokenType = 0x01;
        script.push(utils_1.Utils.getPushDataOpcode([tokenType]));
        script.push(tokenType);
        // Transaction Type
        let transactionType = Buffer.from('GENESIS');
        script.push(utils_1.Utils.getPushDataOpcode(transactionType));
        transactionType.forEach((item) => script.push(item));
        // Ticker
        if (ticker == null || ticker.length === 0) {
            [0x4c, 0x00].forEach((item) => script.push(item));
        }
        else {
            let tickerBuf = Buffer.from(ticker, 'utf8');
            script.push(utils_1.Utils.getPushDataOpcode(tickerBuf));
            tickerBuf.forEach((item) => script.push(item));
        }
        // Name
        if (name == null || name.length === 0) {
            [0x4c, 0x00].forEach((item) => script.push(item));
        }
        else {
            let nameBuf = Buffer.from(name, 'utf8');
            script.push(utils_1.Utils.getPushDataOpcode(nameBuf));
            nameBuf.forEach((item) => script.push(item));
        }
        // Document URL
        if (documentUrl == null || documentUrl.length === 0) {
            [0x4c, 0x00].forEach((item) => script.push(item));
        }
        else {
            let documentUrlBuf = Buffer.from(documentUrl, 'ascii');
            script.push(utils_1.Utils.getPushDataOpcode(documentUrlBuf));
            documentUrlBuf.forEach((item) => script.push(item));
        }
        // check Token Document Hash should be hexademical chracters.
        var re = /^[0-9a-fA-F]+$/;
        // Document Hash
        if (documentHashHex == null || documentHashHex.length === 0) {
            [0x4c, 0x00].forEach((item) => script.push(item));
        }
        else if (documentHashHex.length === 64 && re.test(documentHashHex)) {
            let documentHashBuf = Buffer.from(documentHashHex, 'hex');
            script.push(utils_1.Utils.getPushDataOpcode(documentHashBuf));
            documentHashBuf.forEach((item) => script.push(item));
        }
        else {
            throw Error("Document hash must be provided as a 64 character hex string");
        }
        // Decimals
        if (decimals < 0 || decimals > 9) {
            throw Error("Decimals property must be in range 0 to 9");
        }
        else {
            script.push(utils_1.Utils.getPushDataOpcode([decimals]));
            script.push(decimals);
        }
        // Baton Vout
        if (batonVout == null) {
            [0x4c, 0x00].forEach((item) => script.push(item));
        }
        else {
            if (batonVout <= 1 || !(typeof batonVout == 'number'))
                throw Error("Baton vout must a number and greater than 1");
            script.push(utils_1.Utils.getPushDataOpcode([batonVout]));
            script.push(batonVout);
        }
        // Initial Quantity
        let MAX_QTY = new bignumber_js_1.default('18446744073709551615');
        try {
            initialQuantity.absoluteValue();
        }
        catch (_) {
            throw Error("Amount must be an instance of BigNumber");
        }
        if (initialQuantity.isGreaterThan(MAX_QTY))
            throw new Error("Maximum genesis value exceeded.  Reduce input quantity below 18446744073709551615.");
        if (initialQuantity.isLessThan(0))
            throw Error("Genesis quantity must be greater than 0.");
        if (initialQuantity.modulo(1) != new bignumber_js_1.default(0))
            throw Error("Genesis quantity must be a whole number.");
        let initialQuantityBuf = utils_1.Utils.int2FixedBuffer(initialQuantity);
        script.push(utils_1.Utils.getPushDataOpcode(initialQuantityBuf));
        initialQuantityBuf.forEach((item) => script.push(item));
        let encodedScript = utils_1.Utils.encodeScript(script);
        if (encodedScript.length > 223) {
            throw Error("Script too long, must be less than 223 bytes.");
        }
        return encodedScript;
    }
    static buildSendOpReturn(tokenIdHex, outputQtyArray) {
        let script;
        // OP Return Prefix
        script.push(0x6a);
        // Lokad Id
        let lokadId = Buffer.from(this.lokadIdHex, 'hex');
        script.push(utils_1.Utils.getPushDataOpcode(lokadId));
        lokadId.forEach((item) => script.push(item));
        // Token Type
        let tokenType = 0x01;
        script.push(utils_1.Utils.getPushDataOpcode([tokenType]));
        script.push(tokenType);
        // Transaction Type
        let transactionType = Buffer.from('SEND');
        script.push(utils_1.Utils.getPushDataOpcode(transactionType));
        transactionType.forEach((item) => script.push(item));
        // Token Id
        let tokenId = Buffer.from(tokenIdHex, 'hex');
        script.push(utils_1.Utils.getPushDataOpcode(tokenId));
        tokenId.forEach((item) => script.push(item));
        // Output Quantities
        if (outputQtyArray.length > 19) {
            throw Error("Cannot have more than 19 SLP token outputs.");
        }
        if (outputQtyArray.length < 1) {
            throw Error("Cannot have less than 1 SLP token output.");
        }
        outputQtyArray.forEach((outputQty) => {
            if (!outputQty._isBigNumber)
                throw Error("Amount must be an instance of BigNumber");
            let MAX_QTY = new bignumber_js_1.default('18446744073709551615');
            if (outputQty.isGreaterThan(MAX_QTY))
                throw new Error("Maximum value exceeded.  Reduce input quantity below 18446744073709551615.");
            if (outputQty.isLessThan(0))
                throw Error("All Send outputs must be greater than 0.");
            if (outputQty.modulo(1) != 0)
                throw Error("All Send outputs must be a whole number.");
            let qtyBuffer = utils_1.Utils.int2FixedBuffer(outputQty);
            script.push(utils_1.Utils.getPushDataOpcode(qtyBuffer));
            qtyBuffer.forEach((item) => script.push(item));
        });
        let encodedScript = utils_1.Utils.encodeScript(script);
        if (encodedScript.length > 223) {
            throw Error("Script too long, must be less than 223 bytes.");
        }
        return encodedScript;
    }
}
exports.SlpTokenType1 = SlpTokenType1;
