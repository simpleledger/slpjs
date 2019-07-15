export namespace Primatives {
    class Hex {
        static decode(text: string) {
            return text.match(/.{2}/g)!.map(function(byte) {
                return parseInt(byte, 16);
            });
        }
        static encode(bytes: number[]) {
            var result = [];
            for (var i = 0, hex; i < bytes.length; i++) {
                hex = bytes[i].toString(16);
                if (hex.length < 2) {
                    hex = '0' + hex;
                }
                result.push(hex);
            }
            return result.join('');
        }
    };
    
    class LittleEndian {
        static decode(bytes: number[]) {
            return bytes.reduce(function(previous, current, index) {
                return previous + current * Math.pow(256, index);
            }, 0);
        }
        static encode(number: number, count: number) {
            var rawBytes = [];
            for (var i = 0; i < count; i++) {
                rawBytes[i] = number & 0xff;
                number = Math.floor(number / 256);
            }
            return rawBytes;
        }
    };
    
    export class ArraySource {
        rawBytes: number[];
        index: number;
        constructor(rawBytes: number[], index?: number) {
            this.rawBytes = rawBytes;
            this.index = index || 0;
        }
        readByte() {
            if (!this.hasMoreBytes()) {
                throw new Error('Cannot read past the end of the array.');
            }
            return this.rawBytes[this.index++];
        }
        hasMoreBytes() {
            return this.index < this.rawBytes.length;
        }
        getPosition() {
            return this.index;
        }
    }
    
    export class ByteStream {
        source: ArraySource;
        constructor(source: ArraySource){
            this.source = source;
        }
        readByte() {
            return this.source.readByte();
        }
        readBytes(num: number) {
            var bytes = [];
            for (var i = 0; i < num; i++) {
                bytes.push(this.readByte());
            }
            return bytes;
        }
        readInt(num: number) {
            var bytes = this.readBytes(num);
            return LittleEndian.decode(bytes);
        }
        readVarInt() {
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
        readString() {
            var length = this.readVarInt();
            return this.readBytes(length);
        }
        readHexBytes(num: number) {
            var bytes = this.readBytes(num);
            return Hex.encode(bytes.reverse());
        }
        hasMoreBytes() {
            return this.source.hasMoreBytes();
        }
        getPosition() {
            return this.source.getPosition();
        }
    }
    
    export interface TransactionInput {
        previousTxHash: string,
        previousTxOutIndex: number,
        scriptSig: number[],
        sequenceNo: string,
        incomplete: boolean,
        satoshis?: number
    }
    
    export class Transaction {
        version: number;
        inputs: TransactionInput[];
        outputs: any[];
        lockTime: number;
        constructor(version?: number, inputs?: TransactionInput[], outputs?: any[], lockTime?: number) {
            this.version = version || 1;
            this.inputs = inputs || [];
            this.outputs = outputs || [];
            this.lockTime = lockTime || 0;
        }
        
        toHex() {
            let sink = new ArraySink();
            this.serializeInto(sink);
            return Buffer.from(sink.rawBytes).toString('hex')
        }

        serializeInto(stream: ArraySink) {
            stream.writeInt(this.version, 4);
        
            stream.writeVarInt(this.inputs.length);
            for (var i = 0, input; input = this.inputs[i]; i++) {
                stream.writeHexBytes(input.previousTxHash);
                stream.writeInt(input.previousTxOutIndex, 4);
                stream.writeString(input.scriptSig);
                stream.writeHexBytes(input.sequenceNo);
                if(input.satoshis && input.incomplete)
                    stream.writeInt(input.satoshis, 8);
            }
        
            stream.writeVarInt(this.outputs.length);
            for (var i = 0, output; output = this.outputs[i]; i++) {
                stream.writeInt(output.value, 8);
                stream.writeString(output.scriptPubKey);
            }
        
            stream.writeInt(this.lockTime, 4);
        };
        
        static parseFromBuffer(buffer: Buffer) {
            let source = new Primatives.ArraySource(buffer.toJSON().data)
            let stream = new Primatives.ByteStream(source);
            return Transaction.parse(stream);
        }
      
        static parse(stream: ByteStream, mayIncludeUnsignedInputs=false) {
            var transaction = new Transaction();
            transaction.version = stream.readInt(4);
    
            var txInNum = stream.readVarInt();
            for (var i = 0; i < txInNum; i++) {
                let input: TransactionInput = {
                    previousTxHash: stream.readHexBytes(32),
                    previousTxOutIndex: stream.readInt(4),
                    scriptSig: stream.readString(),
                    sequenceNo: stream.readHexBytes(4),
                    incomplete: false
                }
    
                if(mayIncludeUnsignedInputs && 
                    Buffer.from(input.scriptSig).toString('hex').includes('01ff')) {
                    input.satoshis = stream.readInt(8)
                    input.incomplete = true
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
        }
    }
    
    export class ArraySink {
        rawBytes: number[];
        constructor(rawBytes?: number[]) {
            this.rawBytes = rawBytes || [];
        }
    
        writeByte(byte: number) {
            this.rawBytes.push(byte);
        }
        writeBytes(bytes: number[]) {
            Array.prototype.push.apply(this.rawBytes, bytes);
        }
        writeInt(number: number, count: number) {
            this.writeBytes(LittleEndian.encode(number, count));
        }
        writeVarInt(num: number) {
            if (num < 0xfd) {
                this.writeByte(num);
            } else if (num <= 0xffff) {
                this.writeByte(0xfd);
                this.writeBytes(LittleEndian.encode(num, 2));
            } else {
                throw new Error('Not implemented.');
            }
        }
        writeString(bytes: number[]) {
            this.writeVarInt(bytes.length);
            this.writeBytes(bytes);
        }
        writeHexBytes(text: string) {
            this.writeBytes(Hex.decode(text).reverse())
        }
    }
}
