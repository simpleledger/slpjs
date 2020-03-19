import CryptoJS from "crypto-js";

export class Crypto {
    public static sha256(buffer: Buffer) {
        const words = CryptoJS.enc.Hex.parse(buffer.toString("hex"));
        const hash = CryptoJS.SHA256(words);
        return Buffer.from(hash.toString(CryptoJS.enc.Hex), "hex");
    }
    public static hash256(buffer: Buffer) {
        return this.sha256(this.sha256(buffer));
    }
    public static txid(buffer: Buffer) {
        return Buffer.from(this.hash256(buffer).reverse());
    }
}
