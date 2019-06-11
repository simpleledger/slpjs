import { Utils, SlpAddressUtxoResult, Slp } from "..";
import BigNumber from "bignumber.js";
import * as Bitcore from "bitcore-lib-cash";
import { Primatives } from "./primatives";

export interface InputSigData {
    index: number;
    pubKeyBuf: Buffer;
    signatureBuf: Buffer;
}

export interface ScriptSigP2PK {
    index: number;
    signatureBuf: Buffer;
}

export interface ScriptSigP2PKH {
    index: number;
    pubKeyBuf: Buffer;
    signatureBuf: Buffer;
}

export interface ScriptSigP2SH {
    index: number;
    lockingScriptBuf: Buffer;  //   <-- aka "redeem" script
    unlockingScriptBufArray: (number|Buffer)[]; 
}

export interface MultisigRedeemData {
    m: number,                 // number of signers required
    address: string,           // slp formatted address
    pubKeys: Buffer[],         // pub keys used
    lockingScript: Buffer      // raw redeemscript
}

export class TransactionHelpers {
    slp: Slp;

    constructor(slp: Slp) {
        this.slp = slp;
    }

    // Create raw transaction hex to: Send SLP tokens to one or more token receivers, include optional BCH only outputs
    simpleTokenSend(tokenId: string, sendAmounts: BigNumber|BigNumber[], inputUtxos: SlpAddressUtxoResult[], tokenReceiverAddresses: string|string[], changeReceiverAddress: string, requiredNonTokenOutputs: { satoshis: number, receiverAddress: string }[] = [], extraFee = 0): string {  
        
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
            let sendOpReturn = Slp.buildSendOpReturn({
                tokenIdHex: tokenId,
                outputQtyArray: [ ...(sendAmounts as BigNumber[]), tokenChangeAmount ],
            });
            // 4) Create the raw Send transaction hex
            txHex = this.slp.buildRawSendTx({
                slpSendOpReturn: sendOpReturn,
                input_token_utxos: Utils.mapToUtxoArray(inputUtxos),
                tokenReceiverAddressArray: [ ...tokenReceiverAddresses, changeReceiverAddress ],
                bchChangeReceiverAddress: changeReceiverAddress,
                requiredNonTokenOutputs: requiredNonTokenOutputs,
                extraFee: extraFee
            });
        } else if (tokenChangeAmount.isEqualTo(new BigNumber(0))) {
            // 3) Create the Send OP_RETURN message
            let sendOpReturn = Slp.buildSendOpReturn({
                tokenIdHex: tokenId,
                outputQtyArray: [ ...(sendAmounts as BigNumber[]) ],
            });
            // 4) Create the raw Send transaction hex
            txHex = this.slp.buildRawSendTx({
                slpSendOpReturn: sendOpReturn,
                input_token_utxos: Utils.mapToUtxoArray(inputUtxos),
                tokenReceiverAddressArray: [ ...tokenReceiverAddresses ],
                bchChangeReceiverAddress: changeReceiverAddress,
                requiredNonTokenOutputs: requiredNonTokenOutputs,
                extraFee: extraFee
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
        
        let genesisOpReturn = Slp.buildGenesisOpReturn({ 
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
        
        let genesisOpReturn = Slp.buildNFT1GenesisOpReturn({ 
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
        let mintOpReturn = Slp.buildMintOpReturn({
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
            let sendOpReturn = Slp.buildSendOpReturn({
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

    get_transaction_sig_filler(input_index:  number, pubKeyBuf: Buffer): InputSigData {
        return { signatureBuf: Buffer.from('ff', 'hex'), pubKeyBuf: pubKeyBuf, index: input_index}
    }

    get_transaction_sig_p2pkh(txHex: string, wif: string, input_index: number, input_satoshis: number, sigHashType=0x41): InputSigData {
        
        // deserialize the unsigned transaction

        let txn = new Bitcore.Transaction(txHex);

        // we need to get the key pair from wif
        // this will be used by bitcore-lib input sig generation
        // NOTE: Only works for compressed-WIF format

        let ecpair = this.slp.BITBOX.ECPair.fromWIF(wif);

        // we set the previous output for the input
        // again, this is for bitcore-lib input sig generation

        txn.inputs[input_index].output = new Bitcore.Transaction.Output({
            satoshis: input_satoshis, 
            script: Bitcore.Script.fromAddress(Utils.toCashAddress(ecpair.getAddress())) 
        });

        // Update input to be non-abstract type so we can get the p2pkh sign method

        txn.inputs[input_index] = new Bitcore.Transaction.Input.PublicKeyHash(txn.inputs[input_index]);

        // produce a signature that is specific to this input
        // NOTE: currently only uses ecdsa

        let privateKey = new Bitcore.PrivateKey(wif);
        let sig = txn.inputs[input_index].getSignatures(txn, privateKey, input_index, sigHashType);

        // add have to add the sighash type manually.. :(
        // NOTE: signature is in DER format and is specific to ecdsa & sigHash 0x41

        let sigBuf = Buffer.concat([ sig[0].signature.toDER(), Buffer.alloc(1, sigHashType) ]);  

        // we can return a object conforming to InputSigData<P2pkhSig> interface

        return {
            index: input_index, 
            pubKeyBuf: ecpair.getPublicKeyBuffer(), 
            signatureBuf: sigBuf  
        }
    }

    get_transaction_sig_p2sh(txHex: string, wif: string, input_index: number, input_satoshis: number, redeemScript: Buffer, sigHashType=0x41): InputSigData {
        
        // deserialize the unsigned transaction

        let txn = new Bitcore.Transaction(txHex);

        // we need to get the key pair from wif
        // this will be used by bitcore-lib input sig generation
        // NOTE: Only works for compressed-WIF format

        let ecpair = this.slp.BITBOX.ECPair.fromWIF(wif);

        // we set the previous output for the input
        // again, this is for bitcore-lib input sig generation

        txn.inputs[input_index].output = new Bitcore.Transaction.Output({
            satoshis: input_satoshis, 
            script: redeemScript
        });

        // produce a signature that is specific to this input
        // NOTE: currently only uses ecdsa

        let privateKey = new Bitcore.PrivateKey(wif);
        var sig = Bitcore.Transaction.Sighash.sign(txn, privateKey, sigHashType, input_index, redeemScript, Bitcore.crypto.BN.fromNumber(input_satoshis));
        
        // add have to add the sighash type manually.. :(
        // NOTE: signature is in DER format and is specific to ecdsa & sigHash 0x41

        let sigBuf = Buffer.concat([ sig.toDER(), Buffer.alloc(1, sigHashType) ]);  

        // we can return a object conforming to InputSigData<P2pkhSig> interface

        return {
            index: input_index, 
            pubKeyBuf: ecpair.getPublicKeyBuffer(), 
            signatureBuf: sigBuf  
        }
    }

    build_P2PKH_scriptSig(sigData: InputSigData): ScriptSigP2PKH {
        return sigData;
    }

    // build_P2PK_scriptSig(sigData: InputSigData): scriptSigP2PK {
    //     return {
    //         index: sigData.index,
    //         signatureBuf: sigData.signatureBuf
    //     }
    // }

    build_P2SH_multisig_redeem_data(m: number, pubKeys: string[]|Buffer[]): MultisigRedeemData {

        // allow pubkeys to be passed in as strings

        pubKeys.forEach((k: any, i: number) => {
            if(typeof k === "string")
                pubKeys[i] = Buffer.from(k, 'hex')
        });

        // use bitbox function to get multisig redeem script

        let redeemScript = this.slp.BITBOX.Script.encodeP2MSOutput(m, pubKeys as Buffer[]);

        // compute this multisig address

        let addr = this.slp.BITBOX.Address.fromOutputScript(
                        this.slp.BITBOX.Script.scriptHash.output.encode(
                            this.slp.BITBOX.Crypto.hash160(
                                redeemScript)))
    
        return {
            m: m,
            pubKeys: pubKeys as Buffer[],
            address: Utils.toSlpAddress(addr),
            lockingScript: redeemScript
        }
    }

    insert_input_values_for_EC_signers(txnHex: string, input_values: number[]): string {
        let source = new Primatives.ArraySource(Array.from(Buffer.from(txnHex, 'hex').values()))
        let stream = new Primatives.ByteStream(source)
        let txn = Primatives.Transaction.parse(stream);
        input_values.forEach((v, i) => {
            if(v && v > 0) {
                txn.inputs[i].satoshis = v;
                txn.inputs[i].incomplete = true;
            }
        })
        return txn.toHex();
    }

    build_P2SH_multisig_scriptSig(redeemData: MultisigRedeemData, input_index: number, sigs: InputSigData[]): ScriptSigP2SH {

        // check we have enough signatures

        if(sigs.length < redeemData.m)
            throw Error("Not enough signatures.")

        // check not too many signataures 

        if(sigs.length > redeemData.pubKeys.length)
            throw Error("Too many pubKeys provided.")
        
        // check all provided signatures belong to the given possible pubkeys

        let pubKeysHex: string[] = redeemData.pubKeys.map(k => k.toString('hex'))
        let pubKeysGivenHex: string[] = sigs.map(d => d.pubKeyBuf.toString('hex'))
        pubKeysGivenHex.forEach(k => {
            if(!pubKeysHex.includes(k)) {
                throw Error("One of the public keys provided is a signer")
            }
        });

        // ordered sigs properly for OP_CHECKMULTISIG

        let orderedSigs = pubKeysHex.map(pub => {
            let sig = sigs.find(s => s.pubKeyBuf.toString('hex') === pub)
            return sig!.signatureBuf;
        })

        // build the unlocking script for multisig p2sh

        let unlockingScript = [ 0x00, ...orderedSigs ]; //this.slp.BITBOX.Script.encodeP2MSInput(orderedSigs)

        return {
            index: input_index,
            lockingScriptBuf: redeemData.lockingScript, 
            unlockingScriptBufArray: unlockingScript
        }
    }

    addScriptSigs(unsignedTxnHex: string, scriptSigs: (ScriptSigP2PKH|ScriptSigP2SH|ScriptSigP2PK)[]): string {

        // deserialize unsigned transaction so we can add sigs to it

        let txn = new Bitcore.Transaction(unsignedTxnHex);
        let bip62Encoded: Buffer;
        scriptSigs.forEach(s => {

            // for p2pkh encode scriptSig

            if((s as ScriptSigP2PKH).pubKeyBuf) {  
                let sigBuf = (s as ScriptSigP2PKH).signatureBuf;
                let pubKeyBuf = (s as ScriptSigP2PKH).pubKeyBuf;
                bip62Encoded = this.slp.BITBOX.Script.encode([ sigBuf, pubKeyBuf ]);
            }

            // for p2sh encode scriptSig 

            else if((s as ScriptSigP2SH).lockingScriptBuf) {
                let unlockingBufArray = (s as ScriptSigP2SH).unlockingScriptBufArray;
                let lockingBuf = (s as ScriptSigP2SH).lockingScriptBuf;
                bip62Encoded = this.slp.BITBOX.Script.encode([ ...unlockingBufArray, lockingBuf ]);
            }

            // p2pk encode scriptSig

            else if(!(s as ScriptSigP2PKH).pubKeyBuf && (s as ScriptSigP2PKH).signatureBuf) {
                bip62Encoded = this.slp.BITBOX.Script.encode([ (s as ScriptSigP2PKH).signatureBuf ]);
            }

            // throw if input data did not result in encoded scriptSig

            if(!bip62Encoded)
                throw Error("Was not able to set input script for index="+s.index);

            // actually set the input's scriptSig property

            let script = new Bitcore.Script(bip62Encoded);
            txn.inputs[s.index].setScript(script);
         // console.log("scriptSig for index", s.input_index, ":", bip62Encoded.toString('hex'))
        })

        return txn.toString();
    }

    setTxnLocktime(unsignedTxnHex: string, locktime: number) {
        let source = new Primatives.ArraySource(Array.from(Buffer.from(unsignedTxnHex, 'hex').values()))
        let stream = new Primatives.ByteStream(source)
        let txn = Primatives.Transaction.parse(stream);
        txn.lockTime = locktime;
        return txn.toHex();
    }

    enableInputsCLTV(unsignedTxnHex: string) {
        let source = new Primatives.ArraySource(Array.from(Buffer.from(unsignedTxnHex, 'hex').values()))
        let stream = new Primatives.ByteStream(source)
        let txn = Primatives.Transaction.parse(stream);
        txn.inputs.forEach(input => {
            input.sequenceNo = 'ffffffef';
        });
        return txn.toHex();
    }
}