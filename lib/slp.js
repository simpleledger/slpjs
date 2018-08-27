let slptokentype1 = require('./slptokentype1')

class Slp {
    static buildGenesisOpReturn(ticker, name, urlOrEmail, decimals, batonVout, initialQuantity) {
        return slptokentype1.buildGenesisOpReturn(
            0x01,
            ticker,
            name,
            urlOrEmail,
            null,
            decimals,
            batonVout,
            initialQuantity
        )
    }

    static buildSendOpReturn(tokenIdHex, decimals, outputQtyArray) {
        return slptokentype1.buildSendOpReturn(
            0x01,
            tokenIdHex,
            decimals,
            outputQtyArray            
        )
    }
}

module.exports = Slp