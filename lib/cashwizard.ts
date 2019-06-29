import { Primatives } from "./primatives";
import { Utils } from "..";

export class CashWizardTokenDocument {
    version: number;
    hash160?: Buffer;
    templateId?: Buffer;
    x?: Buffer[];
    l?: Buffer[];
    password?: string;
    hasPassword?: boolean;
    schema: number;
    address?: string;

    constructor({ schema, address, templateId, userDefinedVariables, lockingScriptInputs, password }: { schema?: number; address?: string; templateId?: Buffer; userDefinedVariables?: Buffer[]; lockingScriptInputs?: Buffer[]; password?: string; } = { }) {
        if(schema === undefined || schema === null)
            this.schema = 0x00;
        else
            this.schema = schema;
        this.version = this.schema;
        if(this.schema > 0x00)
            throw Error("Schema 0x00 is currently the only option");
        this.address = address;
        if(password) {
            this.version+=0x10
            this.hasPassword = true;
        }
        if(!address)
            this.version+=0x40
        if(address && Utils.isSlpAddress(address))
            this.version+=0x20
        if(address && !Utils.isMainnet(address))
            this.version+=0x80
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
        stream.writeBytes(this.hash160!.toJSON().data);
        stream.writeBytes(this.templateId!.toJSON().data);
        stream.writeVarInt(this.x!.length);
        this.x!.forEach(x => {
            stream.writeVarInt(x.length);
            stream.writeBytes(x.toJSON().data);
        })
        stream.writeVarInt(this.l!.length);
        this.l!.forEach(l => {
            stream.writeVarInt(l.length);
            stream.writeBytes(l.toJSON().data);
        })
    }

    static parse(buffer: Buffer): CashWizardTokenDocument {
        let source = new Primatives.ArraySource(buffer.toJSON().data)
        let stream = new Primatives.ByteStream(source);
        let version = stream.readByte();
        let doc = new CashWizardTokenDocument({schema: version & 0x0f});
        doc.version = version;
        doc.hasPassword = doc.version & 0x10 ? true : false;
        let network = doc.version & 0x80 ? 'testnet' : 'mainnet';
        let isAddressTokenIdDependant = doc.version & 0x40;
        if(!isAddressTokenIdDependant) {
            doc.hash160 = Buffer.from(stream.readBytes(20));
            let addr = Utils.slpAddressFromHash160(doc.hash160, network, 'p2sh');
            doc.address = doc.version & 0x20 ? addr : Utils.toCashAddress(addr); 
        }
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
