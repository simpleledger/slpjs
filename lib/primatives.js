"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Primatives;
(function (Primatives) {
    var Hex = /** @class */ (function () {
        function Hex() {
        }
        Hex.decode = function (text) {
            return text.match(/.{2}/g).map(function (byte) {
                return parseInt(byte, 16);
            });
        };
        Hex.encode = function (bytes) {
            var result = [];
            for (var i = 0, hex; i < bytes.length; i++) {
                hex = bytes[i].toString(16);
                if (hex.length < 2) {
                    hex = '0' + hex;
                }
                result.push(hex);
            }
            return result.join('');
        };
        return Hex;
    }());
    ;
    var LittleEndian = /** @class */ (function () {
        function LittleEndian() {
        }
        LittleEndian.decode = function (bytes) {
            return bytes.reduce(function (previous, current, index) {
                return previous + current * Math.pow(256, index);
            }, 0);
        };
        LittleEndian.encode = function (number, count) {
            var rawBytes = [];
            for (var i = 0; i < count; i++) {
                rawBytes[i] = number & 0xff;
                number = Math.floor(number / 256);
            }
            return rawBytes;
        };
        return LittleEndian;
    }());
    ;
    var ArraySource = /** @class */ (function () {
        function ArraySource(rawBytes, index) {
            this.rawBytes = rawBytes;
            this.index = index || 0;
        }
        ArraySource.prototype.readByte = function () {
            if (!this.hasMoreBytes()) {
                throw new Error('Cannot read past the end of the array.');
            }
            return this.rawBytes[this.index++];
        };
        ArraySource.prototype.hasMoreBytes = function () {
            return this.index < this.rawBytes.length;
        };
        ArraySource.prototype.getPosition = function () {
            return this.index;
        };
        return ArraySource;
    }());
    Primatives.ArraySource = ArraySource;
    var ByteStream = /** @class */ (function () {
        function ByteStream(source) {
            this.source = source;
        }
        ByteStream.prototype.readByte = function () {
            return this.source.readByte();
        };
        ByteStream.prototype.readBytes = function (num) {
            var bytes = [];
            for (var i = 0; i < num; i++) {
                bytes.push(this.readByte());
            }
            return bytes;
        };
        ByteStream.prototype.readInt = function (num) {
            var bytes = this.readBytes(num);
            return LittleEndian.decode(bytes);
        };
        ByteStream.prototype.readVarInt = function () {
            var num = this.readByte();
            if (num < 0xfd) {
                return num;
            }
            else if (num === 0xfd) {
                return this.readInt(2);
            }
            else if (num === 0xfe) {
                return this.readInt(4);
            }
            else {
                return this.readInt(8);
            }
        };
        ByteStream.prototype.readString = function () {
            var length = this.readVarInt();
            return this.readBytes(length);
        };
        ByteStream.prototype.readHexBytes = function (num) {
            var bytes = this.readBytes(num);
            return Hex.encode(bytes.reverse());
        };
        ByteStream.prototype.hasMoreBytes = function () {
            return this.source.hasMoreBytes();
        };
        ByteStream.prototype.getPosition = function () {
            return this.source.getPosition();
        };
        return ByteStream;
    }());
    Primatives.ByteStream = ByteStream;
    var Transaction = /** @class */ (function () {
        function Transaction(version, inputs, outputs, lockTime) {
            this.version = version || 1;
            this.inputs = inputs || [];
            this.outputs = outputs || [];
            this.lockTime = lockTime || 0;
        }
        Transaction.prototype.toHex = function () {
            var sink = new ArraySink();
            this.serializeInto(sink);
            return Buffer.from(sink.rawBytes).toString('hex');
        };
        Transaction.prototype.serializeInto = function (stream) {
            stream.writeInt(this.version, 4);
            stream.writeVarInt(this.inputs.length);
            for (var i = 0, input; input = this.inputs[i]; i++) {
                stream.writeHexBytes(input.previousTxHash);
                stream.writeInt(input.previousTxOutIndex, 4);
                stream.writeString(input.scriptSig);
                stream.writeHexBytes(input.sequenceNo);
                if (input.satoshis && input.incomplete)
                    stream.writeInt(input.satoshis, 8);
            }
            stream.writeVarInt(this.outputs.length);
            for (var i = 0, output; output = this.outputs[i]; i++) {
                stream.writeInt(output.value, 8);
                stream.writeString(output.scriptPubKey);
            }
            stream.writeInt(this.lockTime, 4);
        };
        ;
        Transaction.parse = function (stream, mayIncludeUnsignedInputs) {
            if (mayIncludeUnsignedInputs === void 0) { mayIncludeUnsignedInputs = false; }
            var transaction = new Transaction();
            transaction.version = stream.readInt(4);
            var txInNum = stream.readVarInt();
            for (var i = 0; i < txInNum; i++) {
                var input = {
                    previousTxHash: stream.readHexBytes(32),
                    previousTxOutIndex: stream.readInt(4),
                    scriptSig: stream.readString(),
                    sequenceNo: stream.readHexBytes(4),
                    incomplete: false
                };
                if (mayIncludeUnsignedInputs &&
                    Buffer.from(input.scriptSig).toString('hex').includes('01ff')) {
                    input.satoshis = stream.readInt(8);
                    input.incomplete = true;
                }
                transaction.inputs.push(input);
            }
            var txOutNum = stream.readVarInt();
            for (var i = 0; i < txOutNum; i++) {
                transaction.outputs.push({
                    value: stream.readInt(8),
                    scriptPubKey: stream.readString()
                });
            }
            transaction.lockTime = stream.readInt(4);
            return transaction;
        };
        return Transaction;
    }());
    Primatives.Transaction = Transaction;
    var ArraySink = /** @class */ (function () {
        function ArraySink(rawBytes) {
            this.rawBytes = rawBytes || [];
        }
        ArraySink.prototype.writeByte = function (byte) {
            this.rawBytes.push(byte);
        };
        ArraySink.prototype.writeBytes = function (bytes) {
            Array.prototype.push.apply(this.rawBytes, bytes);
        };
        ArraySink.prototype.writeInt = function (number, count) {
            this.writeBytes(LittleEndian.encode(number, count));
        };
        ArraySink.prototype.writeVarInt = function (num) {
            if (num < 0xfd) {
                this.writeByte(num);
            }
            else if (num <= 0xffff) {
                this.writeByte(0xfd);
                this.writeBytes(LittleEndian.encode(num, 2));
            }
            else {
                throw new Error('Not implemented.');
            }
        };
        ArraySink.prototype.writeString = function (bytes) {
            this.writeVarInt(bytes.length);
            this.writeBytes(bytes);
        };
        ArraySink.prototype.writeHexBytes = function (text) {
            this.writeBytes(Hex.decode(text).reverse());
        };
        return ArraySink;
    }());
    Primatives.ArraySink = ArraySink;
})(Primatives = exports.Primatives || (exports.Primatives = {}));
//# sourceMappingURL=primatives.js.map