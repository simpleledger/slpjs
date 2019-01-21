
const slp = require('./slp')
, utils = require('./utils')
, bitdbproxy = require('./bitdbproxy')
, validation = require('./proxyvalidation')
, bitbox = require('./bitboxnetwork');

export const slpjs = {
slp: slp,
utils: utils,
bitbox: bitbox, 
bitdb: bitdbproxy, 
validation: validation
}