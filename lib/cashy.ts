import { Primatives } from "./primatives";
import { Utils } from "..";

export class CashyContractTemplate {

}

export class CashyTokenDocument {
    version: number;
    hash160?: Buffer;
    templateId?: Buffer;
    x?: Buffer[];
    l?: Buffer[];
    password?: string;
    hasPassword?: boolean;
    schema?: number;
    address?: string;

    constructor({ version, address, templateId, userDefinedVariables, lockingScriptInputs, password }: { version?: number; address?: string; templateId?: Buffer; userDefinedVariables?: Buffer[]; lockingScriptInputs?: Buffer[]; password?: string; } = {}) {
        this.version = version || 0x00;
        if(this.version < 0x0f) {
            this.schema = version;
            if(password) {
                this.version+=0x10
                this.hasPassword = true;
            }
            this.address = address;
            if(address && Utils.isSlpAddress(address))
                this.version+=0x20
            if(address && !Utils.isMainnet(address))
                this.version+=0x80
        }
        this.password = password ? password : undefined;
        this.hash160 = address ? Buffer.from(Utils.getHash160Buffer(address)) : undefined;
        this.templateId = templateId ? templateId : undefined;
        this.x = userDefinedVariables ? userDefinedVariables : undefined;
        this.l = lockingScriptInputs ? lockingScriptInputs : undefined;
    }

    toBuffer() {
        let sink = new Primatives.ArraySink();
        this.serializeInto(sink);
        return Buffer.from(sink.rawBytes);
    }

    toHex() {
        let buf = this.toBuffer();
        return buf.toString('hex');
    }

    serializeInto(stream: Primatives.ArraySink) {
        stream.writeInt(this.version, 1);
        stream.writeBytes(Array.from(this.hash160!.values()));
        stream.writeBytes(Array.from(this.templateId!.values()));
        stream.writeVarInt(this.x!.length);
        this.x!.forEach(x => {
            stream.writeVarInt(x.length);
            stream.writeBytes(Array.from(x.values()));
        })
        stream.writeVarInt(this.l!.length);
        this.l!.forEach(l => {
            stream.writeVarInt(l.length);
            stream.writeBytes(Array.from(l));
        })
    }

    static parse(buffer: Buffer): CashyTokenDocument {
        let source = new Primatives.ArraySource(Array.from(buffer.values()))
        let stream = new Primatives.ByteStream(source);
        let doc = new CashyTokenDocument();
        doc.version = stream.readByte();
        doc.schema = doc.version & 0x0F;
        if(doc.schema > 0x00)
            throw Error("Schema 0x00 is currently the only option");
        doc.hasPassword = doc.version & 0x10 ? true : false;
        let network = doc.version & 0x80 ? 'testnet' : 'mainnet';
        doc.hash160 = Buffer.from(stream.readBytes(20));
        let addr = Utils.slpAddressFromHash160(doc.hash160, network, 'p2sh');
        doc.address = doc.version & 0x20 ? addr : Utils.toCashAddress(addr); 
        doc.templateId = Buffer.from(stream.readBytes(32));
        let x_length = stream.readVarInt();
        doc.x = [];
        for(let i = 0; i < x_length; i++) {
            let len = stream.readVarInt();
            doc.x.push(Buffer.from(stream.readBytes(len)));
        }
        let l_length = stream.readVarInt();
        doc.l = []
        for(let i = 0; i < l_length; i++) {
            let len = stream.readVarInt();
            doc.l.push(Buffer.from(stream.readBytes(len)));
        }

        return doc;
    }
}
