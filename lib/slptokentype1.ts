import BigNumber from "bignumber.js";
import { TokenType1 } from "slp-mdm";

export class SlpTokenType1 {
    static get lokadIdHex() { return "534c5000"; }

    public static buildGenesisOpReturn(
            ticker: string|null,
            name: string|null,
            documentUrl: string|null,
            documentHashHex: string|null,
            decimals: number,
            batonVout: number|null,
            initialQuantity: BigNumber,
            type= 0x01,
        ) {
            if (decimals === null || decimals === undefined) {
                throw Error("Decimals property must be in range 0 to 9");
            }
            if (ticker !== null && typeof ticker !== "string") {
                throw Error("ticker must be a string");
            }
            if (name !== null && typeof name !== "string") {
                throw Error("name must be a string");
            }
            let res = TokenType1.genesis(
                ticker || "", name || "", documentUrl || "",
                documentHashHex  || "", decimals || 0, batonVout, initialQuantity);
            if (res.length > 223) {
                throw Error("Script too long, must be less than or equal to 223 bytes.");
            }
            return res;
    }

    public static buildSendOpReturn(tokenIdHex: string, outputQtyArray: BigNumber[], type= 0x01) {
        return TokenType1.send(tokenIdHex, outputQtyArray);
    }

    public static buildMintOpReturn(tokenIdHex: string, batonVout: number|null, mintQuantity: BigNumber, type= 0x01) {
        return TokenType1.mint(tokenIdHex, batonVout, mintQuantity);
    }
}
