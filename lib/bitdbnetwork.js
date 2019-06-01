"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../index");
var axios_1 = require("axios");
var bignumber_js_1 = require("bignumber.js");
var BitdbNetwork = /** @class */ (function () {
    function BitdbNetwork(bitdbUrl) {
        if (bitdbUrl === void 0) { bitdbUrl = 'https://bitdb.bch.sx/q/'; }
        this.bitdbUrl = bitdbUrl;
    }
    BitdbNetwork.prototype.getTokenInformation = function (tokenId) {
        return __awaiter(this, void 0, void 0, function () {
            var query, data, config, response, list, tokenDetails;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = {
                            "v": 3,
                            "q": {
                                "find": { "out.h1": "534c5000", "out.s3": "GENESIS", "tx.h": tokenId }
                            },
                            "r": { "f": "[ .[] | { token_type: .out[0].h2, timestamp: (if .blk? then (.blk.t | strftime(\"%Y-%m-%d %H:%M\")) else null end), symbol: .out[0].s4, name: .out[0].s5, document: .out[0].s6, document_sha256: .out[0].h7, decimals: .out[0].h8, baton: .out[0].h9, quantity: .out[0].h10, URI: \"https://tokengraph.network/token/\\(.tx.h)\" } ]" }
                        };
                        data = Buffer.from(JSON.stringify(query)).toString('base64');
                        config = {
                            method: 'GET',
                            url: this.bitdbUrl + data
                        };
                        return [4 /*yield*/, axios_1.default(config)];
                    case 1:
                        response = (_a.sent()).data;
                        list = [];
                        if (response.c) {
                            list.push.apply(list, __spread(response.c));
                        }
                        if (response.u) {
                            list.push.apply(list, __spread(response.u));
                        }
                        if (list.length === 0) {
                            throw new Error('Token not found');
                        }
                        tokenDetails = {
                            transactionType: index_1.SlpTransactionType.GENESIS,
                            tokenIdHex: tokenId,
                            versionType: parseInt(list[0].token_type, 16),
                            timestamp: list[0].timestamp,
                            symbol: list[0].symbol,
                            name: list[0].name,
                            documentUri: list[0].document,
                            documentSha256: list[0].document_sha256 ? Buffer.from(list[0].document_sha256) : null,
                            decimals: parseInt(list[0].decimals, 16) || 0,
                            containsBaton: Buffer.from(list[0].baton, 'hex').readUIntBE(0, 1) >= 2,
                            batonVout: Buffer.from(list[0].baton, 'hex').readUIntBE(0, 1),
                            genesisOrMintQuantity: new bignumber_js_1.default(list[0].quantity, 16).dividedBy(Math.pow(10, (parseInt(list[0].decimals, 16))))
                        };
                        return [2 /*return*/, tokenDetails];
                }
            });
        });
    };
    return BitdbNetwork;
}());
exports.BitdbNetwork = BitdbNetwork;
//# sourceMappingURL=bitdbnetwork.js.map