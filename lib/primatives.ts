// tslint:disable-next-line: no-namespace
export namespace Primatives {
    class Hex {
        public static decode(text: string) {
            return text.match(/.{2}/g)!.map((byte) => {
                return parseInt(byte, 16);
            });
        }
        public static encode(bytes: number[]) {
            const result = [];
            for (let i = 0, hex; i < bytes.length; i++) {
                hex = bytes[i].toString(16);
                if (hex.length < 2) {
                    hex = "0" + hex;
                }
                result.push(hex);
            }
            return result.join("");
        }
    }

    // tslint:disable-next-line: max-classes-per-file
    class LittleEndian {
        public static decode(bytes: number[]) {
            return bytes.reduce((previous, current, index) => {
                return previous + current * Math.pow(256, index);
            }, 0);
        }
        public static encode(number: number, count: number) {
            let rawBytes = [];
            for (let i = 0; i < count; i++) {
                rawBytes[i] = number & 0xff;
                number = Math.floor(number / 256);
            }
            return rawBytes;
        }
    }

    // tslint:disable-next-line: max-classes-per-file
    export class ArraySource {
        public rawBytes: number[];
        public index: number;
        constructor(rawBytes: number[], index?: number) {
            this.rawBytes = rawBytes;
            this.index = index || 0;
        }
        public readByte() {
            if (!this.hasMoreBytes()) {
                throw new Error("Cannot read past the end of the array.");
            }
            return this.rawBytes[this.index++];
        }
        public hasMoreBytes() {
            return this.index < this.rawBytes.length;
        }
        public getPosition() {
            return this.index;
        }
    }
    
    // tslint:disable-next-line: max-classes-per-file
    export class ByteStream {
        public source: ArraySource;
        constructor(source: ArraySource){
            this.source = source;
        }
        public readByte() {
            return this.source.readByte();
        }
        public readBytes(num: number) {
            var bytes = [];
            for (var i = 0; i < num; i++) {
                bytes.push(this.readByte());
            }
            return bytes;
        }
        public readInt(num: number) {
            var bytes = this.readBytes(num);
            return LittleEndian.decode(bytes);
        }
        public readVarInt() {
            var num = this.readByte();
            if (num < 0xfd) {
                return num;
            } else if (num === 0xfd) {
                return this.readInt(2);
            } else if (num === 0xfe) {
                return this.readInt(4);
            } else {
                return this.readInt(8);
            }
        }
        public readString() {
            var length = this.readVarInt();
            return this.readBytes(length);
        }
        public readHexBytes(num: number) {
            var bytes = this.readBytes(num);
            return Hex.encode(bytes.reverse());
        }
        public hasMoreBytes() {
            return this.source.hasMoreBytes();
        }
        public getPosition() {
            return this.source.getPosition();
        }
    }

    export interface TransactionInput {
        previousTxHash: string;
        previousTxOutIndex: number;
        scriptSig: number[];
        sequenceNo: string;
        incomplete: boolean;
        satoshis?: number;
    }

    export interface TransactionOutput {
        scriptPubKey: number[];
        value: number;
    }

    // tslint:disable-next-line: max-classes-per-file
    export class Transaction {
        public static parseFromBuffer(buffer: Buffer) {
            const source = new Primatives.ArraySource(buffer.toJSON().data);
            const stream = new Primatives.ByteStream(source);
            return Transaction.parse(stream);
        }

        public static parse(stream: ByteStream, mayIncludeUnsignedInputs = false) {
            const transaction = new Transaction();
            transaction.version = stream.readInt(4);

            const txInNum = stream.readVarInt();
            for (let i = 0; i < txInNum; i++) {
                const input: TransactionInput = {
                    previousTxHash: stream.readHexBytes(32),
                    previousTxOutIndex: stream.readInt(4),
                    scriptSig: stream.readString(),
                    sequenceNo: stream.readHexBytes(4),
                    // tslint:disable-next-line: object-literal-sort-keys
                    incomplete: false,
                };

                if (mayIncludeUnsignedInputs && 
                    Buffer.from(input.scriptSig).toString("hex").includes("01ff")) {
                    input.satoshis = stream.readInt(8);
                    input.incomplete = true;
                }

                transaction.inputs.push(input);
            }

            let txOutNum = stream.readVarInt();
            for (let i = 0; i < txOutNum; i++) {
                transaction.outputs.push({
                    value: stream.readInt(8),
                    // tslint:disable-next-line: object-literal-sort-keys
                    scriptPubKey: stream.readString(),
                });
            }

            transaction.lockTime = stream.readInt(4);

            return transaction;
        }

        public version: number;
        public inputs: TransactionInput[];
        public outputs: TransactionOutput[];
        public lockTime: number;
        constructor(version?: number, inputs?: TransactionInput[], outputs?: TransactionOutput[], lockTime?: number) {
            this.version = version || 1;
            this.inputs = inputs || [];
            this.outputs = outputs || [];
            this.lockTime = lockTime || 0;
        }

        public toHex() {
            const sink = new ArraySink();
            this.serializeInto(sink);
            return Buffer.from(sink.rawBytes).toString("hex")
        }

        public serializeInto(stream: ArraySink) {
            stream.writeInt(this.version, 4);

            stream.writeVarInt(this.inputs.length);
            for (let i = 0, input; input = this.inputs[i]; i++) {
                stream.writeHexBytes(input.previousTxHash);
                stream.writeInt(input.previousTxOutIndex, 4);
                stream.writeString(input.scriptSig);
                stream.writeHexBytes(input.sequenceNo);
                if (input.satoshis && input.incomplete) {
                    stream.writeInt(input.satoshis, 8);
                }
            }

            stream.writeVarInt(this.outputs.length);
            for (let i = 0, output; output = this.outputs[i]; i++) {
                stream.writeInt(output.value, 8);
                stream.writeString(output.scriptPubKey);
            }

            stream.writeInt(this.lockTime, 4);
        }
    }

    // tslint:disable-next-line: max-classes-per-file
    export class ArraySink {
        public rawBytes: number[];
        constructor(rawBytes?: number[]) {
            this.rawBytes = rawBytes || [];
        }

        public writeByte(byte: number) {
            this.rawBytes.push(byte);
        }
        public writeBytes(bytes: number[]) {
            Array.prototype.push.apply(this.rawBytes, bytes);
        }
        public writeInt(number: number, count: number) {
            this.writeBytes(LittleEndian.encode(number, count));
        }
        public writeVarInt(num: number) {
            if (num < 0xfd) {
                this.writeByte(num);
            } else if (num <= 0xffff) {
                this.writeByte(0xfd);
                this.writeBytes(LittleEndian.encode(num, 2));
            } else {
                throw new Error("Not implemented.");
            }
        }
        public writeString(bytes: number[]) {
            this.writeVarInt(bytes.length);
            this.writeBytes(bytes);
        }
        public writeHexBytes(text: string) {
            this.writeBytes(Hex.decode(text).reverse())
        }
    }
}
