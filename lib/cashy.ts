import { Primatives } from "./primatives";

export class CashyTokenDocument {
    version: number;
    tokenId: number[];
    x: number[][];
    l: number[][];

    constructor(version?: number, tokenId?: Buffer, userDefinedVariables?: Buffer[], lockingScriptInputs?: Buffer[]) {
        this.version = version || 1;
        this.tokenId = tokenId ? Array.from(tokenId.values()) : [];
        this.x = userDefinedVariables ? userDefinedVariables.map(udv => Array.from(udv.values())) : [];
        this.l = lockingScriptInputs ? lockingScriptInputs.map(udv => Array.from(udv.values())) : [];
    }

    toHex() {
        let sink = new Primatives.ArraySink();
        this.serializeInto(sink);
        return Buffer.from(sink.rawBytes).toString('hex');
    }

    serializeInto(stream: Primatives.ArraySink) {
        stream.writeInt(this.version, 1);
        stream.writeBytes(this.tokenId);
        stream.writeVarInt(this.x.length);
        this.x.forEach(x => {
            stream.writeVarInt(x.length);
            stream.writeBytes(x);
        })
        stream.writeVarInt(this.l.length);
        this.l.forEach(l => {
            stream.writeVarInt(l.length);
            stream.writeBytes(l);
        })
    }

    static parse(buffer: Buffer) {
        let source = new Primatives.ArraySource(Array.from(buffer.values()))
        let stream = new Primatives.ByteStream(source);
        let doc = new CashyTokenDocument();
        doc.version = stream.readByte();
        doc.tokenId = stream.readBytes(32);
        let x_length = stream.readVarInt();
        doc.x = [];
        for(let i = 0; i < x_length; i++) {
            let len = stream.readVarInt();
            doc.x.push(stream.readBytes(len));
        }
        let l_length = stream.readVarInt();
        doc.l = []
        for(let i = 0; i < l_length; i++) {
            let len = stream.readVarInt();
            doc.l.push(stream.readBytes(len));
        }
    }
}
