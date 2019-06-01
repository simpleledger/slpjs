"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var bignumber_js_1 = require("bignumber.js");
var SlpTokenType1 = /** @class */ (function () {
    function SlpTokenType1() {
    }
    Object.defineProperty(SlpTokenType1, "lokadIdHex", {
        get: function () { return "534c5000"; },
        enumerable: true,
        configurable: true
    });
    SlpTokenType1.buildNFT1GenesisOpReturn = function (ticker, name, parentTokenIdHex, parentInputIndex) {
        var vin = parentInputIndex.toString(16).padStart(4, '0');
        var re = /^([A-Fa-f0-9]{2}){32,32}$/;
        if (typeof parentTokenIdHex !== 'string' || !re.test(parentTokenIdHex))
            throw Error("ParentTokenIdHex must be provided as a 64 character hex string.");
        return this.buildGenesisOpReturn(ticker, name, "NFT1_" + parentTokenIdHex + "_" + vin, null, 0, null, new bignumber_js_1.default(1));
    };
    SlpTokenType1.buildGenesisOpReturn = function (ticker, name, documentUri, documentHashHex, decimals, batonVout, initialQuantity) {
        var script = [];
        // OP Return Prefix
        script.push(0x6a);
        // Lokad Id
        var lokadId = Buffer.from(this.lokadIdHex, 'hex');
        script.push(utils_1.Utils.getPushDataOpcode(lokadId));
        lokadId.forEach(function (item) { return script.push(item); });
        // Token Version/Type
        var tokenVersionType = 0x01;
        script.push(utils_1.Utils.getPushDataOpcode([tokenVersionType]));
        script.push(tokenVersionType);
        // Transaction Type
        var transactionType = Buffer.from('GENESIS');
        script.push(utils_1.Utils.getPushDataOpcode(transactionType));
        transactionType.forEach(function (item) { return script.push(item); });
        // Ticker
        if (ticker && typeof ticker !== 'string') {
            throw Error("ticker must be a string");
        }
        else if (!ticker || ticker.length === 0) {
            [0x4c, 0x00].forEach(function (item) { return script.push(item); });
        }
        else {
            var tickerBuf = Buffer.from(ticker, 'utf8');
            script.push(utils_1.Utils.getPushDataOpcode(tickerBuf));
            tickerBuf.forEach(function (item) { return script.push(item); });
        }
        // Name
        if (name && typeof name !== 'string') {
            throw Error("name must be a string");
        }
        else if (!name || name.length === 0) {
            [0x4c, 0x00].forEach(function (item) { return script.push(item); });
        }
        else {
            var nameBuf = Buffer.from(name, 'utf8');
            script.push(utils_1.Utils.getPushDataOpcode(nameBuf));
            nameBuf.forEach(function (item) { return script.push(item); });
        }
        // Document URL
        if (documentUri && typeof documentUri !== 'string' && !(documentUri instanceof Buffer)) {
            throw Error("documentUri must be a string or a buffer");
        }
        else if (!documentUri || documentUri.length === 0) {
            [0x4c, 0x00].forEach(function (item) { return script.push(item); });
        }
        else if (documentUri instanceof Buffer) {
            script.push(utils_1.Utils.getPushDataOpcode(documentUri));
            documentUri.forEach(function (item) { return script.push(item); });
        }
        else {
            var documentUriBuf = Buffer.from(documentUri, 'ascii');
            script.push(utils_1.Utils.getPushDataOpcode(documentUriBuf));
            documentUriBuf.forEach(function (item) { return script.push(item); });
        }
        // check Token Document Hash should be hexademical chracters.
        var re = /^[0-9a-fA-F]+$/;
        // Document Hash
        if (!documentHashHex || documentHashHex.length === 0) {
            [0x4c, 0x00].forEach(function (item) { return script.push(item); });
        }
        else if (documentHashHex.length === 64 && re.test(documentHashHex)) {
            var documentHashBuf = Buffer.from(documentHashHex, 'hex');
            script.push(utils_1.Utils.getPushDataOpcode(documentHashBuf));
            documentHashBuf.forEach(function (item) { return script.push(item); });
        }
        else {
            throw Error("Document hash must be provided as a 64 character hex string");
        }
        // Decimals
        if (decimals === null || decimals === undefined || decimals < 0 || decimals > 9) {
            throw Error("Decimals property must be in range 0 to 9");
        }
        else {
            script.push(utils_1.Utils.getPushDataOpcode([decimals]));
            script.push(decimals);
        }
        // Baton Vout
        if (batonVout === null || batonVout === undefined) {
            [0x4c, 0x00].forEach(function (item) { return script.push(item); });
        }
        else {
            if (batonVout < 2 || batonVout > 255 || !(typeof batonVout == 'number'))
                throw Error("Baton vout must a number and greater than 1 and less than 256.");
            script.push(utils_1.Utils.getPushDataOpcode([batonVout]));
            script.push(batonVout);
        }
        // Initial Quantity
        var MAX_QTY = new bignumber_js_1.default('18446744073709551615');
        try {
            initialQuantity.absoluteValue();
        }
        catch (_) {
            throw Error("Amount must be an instance of BigNumber");
        }
        if (initialQuantity.isGreaterThan(MAX_QTY))
            throw new Error("Maximum genesis value exceeded. Reduce input quantity below 18446744073709551615.");
        if (initialQuantity.isLessThan(0))
            throw Error("Genesis quantity must be greater than 0.");
        if (!initialQuantity.modulo(1).isEqualTo(new bignumber_js_1.default(0)))
            throw Error("Genesis quantity must be a whole number.");
        var initialQuantityBuf = utils_1.Utils.int2FixedBuffer(initialQuantity);
        script.push(utils_1.Utils.getPushDataOpcode(initialQuantityBuf));
        initialQuantityBuf.forEach(function (item) { return script.push(item); });
        var encodedScript = utils_1.Utils.encodeScript(script);
        if (encodedScript.length > 223) {
            throw Error("Script too long, must be less than 223 bytes.");
        }
        return encodedScript;
    };
    SlpTokenType1.buildSendOpReturn = function (tokenIdHex, outputQtyArray) {
        var script = [];
        // OP Return Prefix
        script.push(0x6a);
        // Lokad Id
        var lokadId = Buffer.from(this.lokadIdHex, 'hex');
        script.push(utils_1.Utils.getPushDataOpcode(lokadId));
        lokadId.forEach(function (item) { return script.push(item); });
        // Token Version/Type
        var tokenVersionType = 0x01;
        script.push(utils_1.Utils.getPushDataOpcode([tokenVersionType]));
        script.push(tokenVersionType);
        // Transaction Type
        var transactionType = Buffer.from('SEND');
        script.push(utils_1.Utils.getPushDataOpcode(transactionType));
        transactionType.forEach(function (item) { return script.push(item); });
        // Token Id
        // check Token Id should be hexademical chracters.
        var re = /^([A-Fa-f0-9]{2}){32,32}$/;
        if (typeof tokenIdHex !== 'string' || !re.test(tokenIdHex)) {
            throw Error("TokenIdHex must be provided as a 64 character hex string.");
        }
        var tokenId = Buffer.from(tokenIdHex, 'hex');
        script.push(utils_1.Utils.getPushDataOpcode(tokenId));
        tokenId.forEach(function (item) { return script.push(item); });
        // Output Quantities
        if (outputQtyArray.length > 19) {
            throw Error("Cannot have more than 19 SLP token outputs.");
        }
        if (outputQtyArray.length < 1) {
            throw Error("Cannot have less than 1 SLP token output.");
        }
        outputQtyArray.forEach(function (outputQty) {
            try {
                outputQty.absoluteValue();
            }
            catch (_) {
                throw Error("Amount must be an instance of BigNumber");
            }
            var MAX_QTY = new bignumber_js_1.default('18446744073709551615');
            if (outputQty.isGreaterThan(MAX_QTY))
                throw new Error("Maximum value exceeded. Reduce input quantity below 18446744073709551615.");
            if (outputQty.isLessThan(0))
                throw Error("All Send outputs must be greater than 0.");
            if (!outputQty.modulo(1).isEqualTo(new bignumber_js_1.default(0)))
                throw Error("All Send outputs must be a whole number.");
            var qtyBuffer = utils_1.Utils.int2FixedBuffer(outputQty);
            script.push(utils_1.Utils.getPushDataOpcode(qtyBuffer));
            qtyBuffer.forEach(function (item) { return script.push(item); });
        });
        var encodedScript = utils_1.Utils.encodeScript(script);
        if (encodedScript.length > 223) {
            throw Error("Script too long, must be less than 223 bytes.");
        }
        return encodedScript;
    };
    SlpTokenType1.buildMintOpReturn = function (tokenIdHex, batonVout, mintQuantity) {
        var script = [];
        // OP Return Prefix
        script.push(0x6a);
        // Lokad Id
        var lokadId = Buffer.from(this.lokadIdHex, 'hex');
        script.push(utils_1.Utils.getPushDataOpcode(lokadId));
        lokadId.forEach(function (item) { return script.push(item); });
        // Token Version/Type
        var tokenVersionType = 0x01;
        script.push(utils_1.Utils.getPushDataOpcode([tokenVersionType]));
        script.push(tokenVersionType);
        // Transaction Type
        var transactionType = Buffer.from('MINT');
        script.push(utils_1.Utils.getPushDataOpcode(transactionType));
        transactionType.forEach(function (item) { return script.push(item); });
        // Token Id
        // check Token Id should be hexademical chracters.
        var re = /^([A-Fa-f0-9]{2}){32,32}$/;
        if (typeof tokenIdHex !== 'string' || !re.test(tokenIdHex)) {
            throw Error("TokenIdHex must be provided as a 64 character hex string.");
        }
        var tokenId = Buffer.from(tokenIdHex, 'hex');
        script.push(utils_1.Utils.getPushDataOpcode(tokenId));
        tokenId.forEach(function (item) { return script.push(item); });
        // Baton Vout
        if (batonVout === null || batonVout === undefined) {
            [0x4c, 0x00].forEach(function (item) { return script.push(item); });
        }
        else {
            if (batonVout < 2 || batonVout > 255 || !(typeof batonVout == 'number'))
                throw Error("Baton vout must a number and greater than 1 and less than 256.");
            script.push(utils_1.Utils.getPushDataOpcode([batonVout]));
            script.push(batonVout);
        }
        // Initial Quantity
        var MAX_QTY = new bignumber_js_1.default('18446744073709551615');
        try {
            mintQuantity.absoluteValue();
        }
        catch (_) {
            throw Error("Amount must be an instance of BigNumber");
        }
        if (mintQuantity.isGreaterThan(MAX_QTY))
            throw new Error("Maximum mint value exceeded. Reduce input quantity below 18446744073709551615.");
        if (mintQuantity.isLessThan(0))
            throw Error("Mint quantity must be greater than 0.");
        if (!mintQuantity.modulo(1).isEqualTo(new bignumber_js_1.default(0)))
            throw Error("Mint quantity must be a whole number.");
        var initialQuantityBuf = utils_1.Utils.int2FixedBuffer(mintQuantity);
        script.push(utils_1.Utils.getPushDataOpcode(initialQuantityBuf));
        initialQuantityBuf.forEach(function (item) { return script.push(item); });
        var encodedScript = utils_1.Utils.encodeScript(script);
        if (encodedScript.length > 223) {
            throw Error("Script too long, must be less than 223 bytes.");
        }
        return encodedScript;
    };
    return SlpTokenType1;
}());
exports.SlpTokenType1 = SlpTokenType1;
//# sourceMappingURL=slptokentype1.js.map