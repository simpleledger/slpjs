"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var TokenTransactionType;
(function (TokenTransactionType) {
    TokenTransactionType[TokenTransactionType["GENESIS"] = 0] = "GENESIS";
    TokenTransactionType[TokenTransactionType["MINT"] = 1] = "MINT";
    TokenTransactionType[TokenTransactionType["SEND"] = 2] = "SEND";
})(TokenTransactionType = exports.TokenTransactionType || (exports.TokenTransactionType = {}));
var TokenType;
(function (TokenType) {
    TokenType[TokenType["TokenType1"] = 1] = "TokenType1";
})(TokenType = exports.TokenType || (exports.TokenType = {}));
const slp = require('./lib/slp'), utils = require('./lib/utils'), bitdbproxy = require('./lib/bitdbproxy'), validation = require('./lib/proxyvalidation'), bitbox = require('./lib/bitboxnetwork');
exports.slpjs = {
    slp: slp,
    utils: utils,
    bitbox: bitbox,
    bitdb: bitdbproxy,
    validation: validation
};
