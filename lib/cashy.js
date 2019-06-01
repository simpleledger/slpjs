"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var primatives_1 = require("./primatives");
var CashyTokenDocument = /** @class */ (function () {
    function CashyTokenDocument(version, tokenId, userDefinedVariables, lockingScriptInputs) {
        this.version = version || 1;
        this.tokenId = tokenId ? Array.from(tokenId.values()) : [];
        this.x = userDefinedVariables ? userDefinedVariables.map(function (udv) { return Array.from(udv.values()); }) : [];
        this.l = lockingScriptInputs ? lockingScriptInputs.map(function (udv) { return Array.from(udv.values()); }) : [];
    }
    CashyTokenDocument.prototype.toHex = function () {
        var sink = new primatives_1.Primatives.ArraySink();
        this.serializeInto(sink);
        return Buffer.from(sink.rawBytes).toString('hex');
    };
    CashyTokenDocument.prototype.serializeInto = function (stream) {
        stream.writeInt(this.version, 1);
        stream.writeBytes(this.tokenId);
        stream.writeVarInt(this.x.length);
        this.x.forEach(function (x) {
            stream.writeVarInt(x.length);
            stream.writeBytes(x);
        });
        stream.writeVarInt(this.l.length);
        this.l.forEach(function (l) {
            stream.writeVarInt(l.length);
            stream.writeBytes(l);
        });
    };
    CashyTokenDocument.parse = function (buffer) {
        var source = new primatives_1.Primatives.ArraySource(Array.from(buffer.values()));
        var stream = new primatives_1.Primatives.ByteStream(source);
        var doc = new CashyTokenDocument();
        doc.version = stream.readByte();
        doc.tokenId = stream.readBytes(32);
        var x_length = stream.readVarInt();
        doc.x = [];
        for (var i = 0; i < x_length; i++) {
            var len = stream.readVarInt();
            doc.x.push(stream.readBytes(len));
        }
        var l_length = stream.readVarInt();
        doc.l = [];
        for (var i = 0; i < l_length; i++) {
            var len = stream.readVarInt();
            doc.l.push(stream.readBytes(len));
        }
    };
    return CashyTokenDocument;
}());
exports.CashyTokenDocument = CashyTokenDocument;
//# sourceMappingURL=cashy.js.map