import BigNumber from "bignumber.js";
import { NFT1, TokenType1 } from "slp-mdm";

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
            let res: Buffer;
            switch (type) {
                case 0x01:
                    res = TokenType1.genesis(
                                        ticker || "",
                                        name || "",
                                        documentUrl || "",
                                        documentHashHex  || "",
                                        decimals || 0,
                                        batonVout,
                                        initialQuantity
                                    );
                    break;
                case 0x41:
                    if (! initialQuantity.isEqualTo(1)) {
                        throw Error("nft1 child output quantity must be equal to 1");
                    }
                    res = NFT1.Child.genesis(ticker || "",
                                        name || "",
                                        documentUrl || "",
                                        documentHashHex  || ""
                                    );
                    break;
                case 0x81:
                    res = NFT1.Group.genesis(
                                        ticker || "",
                                        name || "",
                                        documentUrl || "",
                                        documentHashHex  || "",
                                        decimals || 0,
                                        batonVout,
                                        initialQuantity
                                    );
                    break;
                default:
                    throw Error("unsupported token type");
            }
            if (res.length > 223) {
                throw Error("Script too long, must be less than or equal to 223 bytes.");
            }
            return res;
    }

    public static buildSendOpReturn(tokenIdHex: string, outputQtyArray: BigNumber[], type= 0x01) {
        switch (type) {
            case 0x01:
                return TokenType1.send(tokenIdHex, outputQtyArray);
            case 0x41:
                if (outputQtyArray.length !== 1) {
                    throw Error("nft1 child must have exactly 1 output quantity");
                }
                if (! outputQtyArray[0].isEqualTo(1)) {
                    throw Error("nft1 child output quantity must be equal to 1");
                }
                return NFT1.Child.send(tokenIdHex, outputQtyArray);
            case 0x81:
                return NFT1.Group.send(tokenIdHex, outputQtyArray);
            default:
                throw Error("unsupported token type");
        }
    }

    public static buildMintOpReturn(tokenIdHex: string, batonVout: number|null, mintQuantity: BigNumber, type= 0x01) {
        switch (type) {
            case 0x01:
                return TokenType1.mint(tokenIdHex, batonVout, mintQuantity);
            case 0x41:
                throw Error("nft1 child cannot mint");
            case 0x81:
                return NFT1.Group.mint(tokenIdHex, batonVout, mintQuantity);
            default:
                throw Error("unsupported token type");
        }
    }
}
