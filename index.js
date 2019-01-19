const BITBOXSDK = require('bitbox-sdk/lib/bitbox-sdk').default
    , BITBOX = new BITBOXSDK()

const slp = require('./lib/slp')
    , utils = require('./lib/utils')
    , bitdb = require('./lib/bitdbproxy')
    , validation = require('./lib/proxyvalidation')
    , bitbox = require('./lib/bitboxnetwork');

module.exports = {
    slp: slp,
    utils: utils,
    bitbox: bitbox, 
    bitdb: bitdb, 
    validation: validation,
    bitboxsdk: BITBOX 
}