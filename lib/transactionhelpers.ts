import { Utils, SlpAddressUtxoResult, Slp } from "..";
import BigNumber from "bignumber.js";

export class TransactionHelpers {
    slp: Slp;

    constructor(slp: Slp) {
        this.slp = slp;
    }

    // Create raw transaction hex to: Send SLP tokens to one or more token receivers, include optional BCH only outputs
    simpleTokenSend(tokenId: string, sendAmounts: BigNumber|BigNumber[], inputUtxos: SlpAddressUtxoResult[], tokenReceiverAddresses: string|string[], changeReceiverAddress: string, requiredNonTokenOutputs: { satoshis: number, receiverAddress: string }[] = []): string {  
        
        // normalize token receivers and amounts to array types
        if(typeof tokenReceiverAddresses === "string")
            tokenReceiverAddresses = [ tokenReceiverAddresses ];
        try {
            let amount = sendAmounts as BigNumber[];
            amount.forEach(a => a.isGreaterThan(new BigNumber(0)));
        } catch(_) { sendAmounts = [ sendAmounts ] as BigNumber[]; }
        if((sendAmounts as BigNumber[]).length !== (tokenReceiverAddresses as string[]).length) {
            throw Error("Must have send amount item for each token receiver specified.");
        }

        // 1) Set the token send amounts, we'll send 100 tokens to a new receiver and send token change back to the sender
        let totalTokenInputAmount: BigNumber = 
            inputUtxos
            .filter(txo => {
                return Slp.preSendSlpJudgementCheck(txo, tokenId);
            })
            .reduce((tot: BigNumber, txo: SlpAddressUtxoResult) => { 
                return tot.plus(txo.slpUtxoJudgementAmount)
            }, new BigNumber(0))

        // 2) Compute the token Change amount.
        let tokenChangeAmount: BigNumber = totalTokenInputAmount.minus((sendAmounts as BigNumber[]).reduce((t, v) => t = t.plus(v), new BigNumber(0)));
        
        let txHex;
        if(tokenChangeAmount.isGreaterThan(new BigNumber(0))){
            // 3) Create the Send OP_RETURN message
            let sendOpReturn = this.slp.buildSendOpReturn({
                tokenIdHex: tokenId,
                outputQtyArray: [ ...(sendAmounts as BigNumber[]), tokenChangeAmount ],
            });
            // 4) Create the raw Send transaction hex
            txHex = this.slp.buildRawSendTx({
                slpSendOpReturn: sendOpReturn,
                input_token_utxos: Utils.mapToUtxoArray(inputUtxos),
                tokenReceiverAddressArray: [ ...tokenReceiverAddresses, changeReceiverAddress ],
                bchChangeReceiverAddress: changeReceiverAddress,
                requiredNonTokenOutputs: requiredNonTokenOutputs
            });
        } else if (tokenChangeAmount.isEqualTo(new BigNumber(0))) {
            // 3) Create the Send OP_RETURN message
            let sendOpReturn = this.slp.buildSendOpReturn({
                tokenIdHex: tokenId,
                outputQtyArray: [ ...(sendAmounts as BigNumber[]) ],
            });
            // 4) Create the raw Send transaction hex
            txHex = this.slp.buildRawSendTx({
                slpSendOpReturn: sendOpReturn,
                input_token_utxos: Utils.mapToUtxoArray(inputUtxos),
                tokenReceiverAddressArray: [ ...tokenReceiverAddresses ],
                bchChangeReceiverAddress: changeReceiverAddress,
                requiredNonTokenOutputs: requiredNonTokenOutputs
            });
        } else
            throw Error('Token inputs less than the token outputs');

        // Return raw hex for this transaction
        return txHex;
    }

    // Create raw transaction hex to: Send BCH to one or more receivers, makes sure tokens are not burned
    simpleBchSend(sendAmounts: BigNumber|BigNumber[], inputUtxos: SlpAddressUtxoResult[], bchReceiverAddresses: string|string[], changeReceiverAddress: string): string {

        // normalize token receivers and amounts to array types
        if(typeof bchReceiverAddresses === "string")
            bchReceiverAddresses = [ bchReceiverAddresses ];

        if(typeof sendAmounts === "string")
            sendAmounts = [ sendAmounts ];

        try {
            let amount = sendAmounts as BigNumber[];
            amount.forEach(a => a.isGreaterThan(new BigNumber(0)));
        } catch(_) { sendAmounts = [ sendAmounts ] as BigNumber[]; }
        if((sendAmounts as BigNumber[]).length !== (bchReceiverAddresses as string[]).length) {
            throw Error("Must have send amount item for each token receiver specified.");
        }

        // 4) Create the raw Send transaction hex
        let txHex = this.slp.buildRawBchOnlyTx({
            input_token_utxos: Utils.mapToUtxoArray(inputUtxos),
            bchReceiverAddressArray: bchReceiverAddresses,
            bchReceiverSatoshiAmounts: sendAmounts as BigNumber[],
            bchChangeReceiverAddress: changeReceiverAddress
        });

        // Return raw hex for this transaction
        return txHex;
    }

    // Create raw transaction hex to: Create a token Genesis issuance
    simpleTokenGenesis(tokenName: string, tokenTicker: string, tokenAmount: BigNumber, documentUri: string, documentHash: Buffer|null, decimals: number, tokenReceiverAddress: string, batonReceiverAddress: string|null, bchChangeReceiverAddress: string, inputUtxos: SlpAddressUtxoResult[]): string {
        
        let genesisOpReturn = this.slp.buildGenesisOpReturn({ 
            ticker: tokenTicker,
            name: tokenName,
            documentUri: documentUri,
            hash: documentHash, 
            decimals: decimals,
            batonVout: batonReceiverAddress ? 2 : null,
            initialQuantity: tokenAmount,
        });

        // 4) Create/sign the raw transaction hex for Genesis
        let genesisTxHex = this.slp.buildRawGenesisTx({
            slpGenesisOpReturn: genesisOpReturn, 
            mintReceiverAddress: tokenReceiverAddress,
            batonReceiverAddress: batonReceiverAddress,
            bchChangeReceiverAddress: bchChangeReceiverAddress, 
            input_utxos: Utils.mapToUtxoArray(inputUtxos)
        });

        // Return raw hex for this transaction
        return genesisTxHex;
    }

    // Create raw transaction hex to: Create a NFT1 token Genesis issuance
    simpleNFT1Genesis(tokenName: string, tokenTicker: string, parentTokenIdHex: string, tokenReceiverAddress: string, bchChangeReceiverAddress: string, inputUtxos: SlpAddressUtxoResult[]): string {
        let index = inputUtxos.findIndex(i => i.slpTransactionDetails.tokenIdHex === parentTokenIdHex);
        
        let genesisOpReturn = this.slp.buildNFT1GenesisOpReturn({ 
            ticker: tokenTicker,
            name: tokenName,
            parentTokenIdHex: parentTokenIdHex,
            parentInputIndex: index
        });

        // 4) Create/sign the raw transaction hex for Genesis
        let genesisTxHex = this.slp.buildRawNFT1GenesisTx({
            slpNFT1GenesisOpReturn: genesisOpReturn, 
            mintReceiverAddress: tokenReceiverAddress,
            bchChangeReceiverAddress: bchChangeReceiverAddress, 
            input_utxos: Utils.mapToUtxoArray(inputUtxos),
            parentTokenIdHex: parentTokenIdHex
        });

        // Return raw hex for this transaction
        return genesisTxHex;
    }

    // Create raw transaction hex to: Mint new tokens or move the minting baton
    simpleTokenMint(tokenId: string, mintAmount: BigNumber, inputUtxos: SlpAddressUtxoResult[], tokenReceiverAddress: string, batonReceiverAddress: string, changeReceiverAddress: string): string {  
        // // convert address to cashAddr from SLP format.
        // let fundingAddress_cashfmt = bchaddr.toCashAddress(fundingAddress);

        // 1) Create the Send OP_RETURN message
        let mintOpReturn = this.slp.buildMintOpReturn({
            tokenIdHex: tokenId,
            mintQuantity: mintAmount,
            batonVout: 2
        });

        // 2) Create the raw Mint transaction hex
        let txHex = this.slp.buildRawMintTx({
            input_baton_utxos: Utils.mapToUtxoArray(inputUtxos),
            slpMintOpReturn: mintOpReturn,
            mintReceiverAddress: tokenReceiverAddress,
            batonReceiverAddress: batonReceiverAddress,
            bchChangeReceiverAddress: changeReceiverAddress
        });
        
        //console.log(txHex);

        // Return raw hex for this transaction
        return txHex;
    }

    // Create raw transaction hex to: Burn a precise quantity of SLP tokens with remaining tokens (change) sent to a single output address
    simpleTokenBurn(tokenId: string, burnAmount: BigNumber, inputUtxos: SlpAddressUtxoResult[], changeReceiverAddress: string): string {  
    
        // Set the token send amounts
        let totalTokenInputAmount: BigNumber = 
            inputUtxos
            .filter(txo => {
                return Slp.preSendSlpJudgementCheck(txo, tokenId);
            })
            .reduce((tot: BigNumber, txo: SlpAddressUtxoResult) => { 
                return tot.plus(txo.slpUtxoJudgementAmount)
            }, new BigNumber(0))

        // Compute the token Change amount.
        let tokenChangeAmount: BigNumber = totalTokenInputAmount.minus(burnAmount);
        
        let txHex;
        if(tokenChangeAmount.isGreaterThan(new BigNumber(0))){
            // Create the Send OP_RETURN message
            let sendOpReturn = this.slp.buildSendOpReturn({
                tokenIdHex: tokenId,
                outputQtyArray: [ tokenChangeAmount ],
            });
            // Create the raw Send transaction hex
            txHex = this.slp.buildRawBurnTx(burnAmount, {
                slpBurnOpReturn: sendOpReturn,
                input_token_utxos: Utils.mapToUtxoArray(inputUtxos),
                bchChangeReceiverAddress: changeReceiverAddress
            });
        } else if (tokenChangeAmount.isLessThanOrEqualTo(new BigNumber(0))) {
            // Create the raw Send transaction hex
            txHex = this.slp.buildRawBurnTx(burnAmount, {
                tokenIdHex: tokenId,
                input_token_utxos: Utils.mapToUtxoArray(inputUtxos),
                bchChangeReceiverAddress: changeReceiverAddress
            });
        } else
            throw Error('Token inputs less than the token outputs');

        // Return raw hex for this transaction
        return txHex;
    }
}
