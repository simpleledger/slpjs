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
            return TokenType1.genesis(
                ticker || "", name || "", documentUrl || "",
                documentHashHex  || "", decimals, batonVout || null, initialQuantity);
    }

    public static buildSendOpReturn(tokenIdHex: string, outputQtyArray: BigNumber[], type= 0x01) {
        return TokenType1.send(tokenIdHex, outputQtyArray);
    }

    public static buildMintOpReturn(tokenIdHex: string, batonVout: number|null, mintQuantity: BigNumber, type= 0x01) {
        return TokenType1.mint(tokenIdHex, batonVout, mintQuantity);
    }
}
