import { Utils } from '../lib/utils';
import * as assert from 'assert';
import "mocha";
import { SlpPaymentRequest } from '..';

describe('Utils', function() {
    describe('Address Conversion and Network Detection', function() {
        it("buildSlpUri()", () => {
            let expected_uri = "simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk"
            let uri = Utils.buildSlpUri("qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk")
            assert.equal(expected_uri, uri)
        })
        it("buildSlpUri()", () => {
            let expected_uri = "simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk"
            let uri = Utils.buildSlpUri("simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk")
            assert.equal(expected_uri, uri)
        })
        it("buildSlpUri()", () => {
            let expected_uri = "simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk?amount=10.1"
            let uri = Utils.buildSlpUri("qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk", 10.1)
            assert.equal(expected_uri, uri)
        })
        it("buildSlpUri()", () => {
            let expected_uri = "simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk?amount=1.01-fa6c74c52450fc164e17402a46645ce494a8a8e93b1383fa27460086931ef59f"
            let uri = Utils.buildSlpUri("qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk", undefined, 1.01, "fa6c74c52450fc164e17402a46645ce494a8a8e93b1383fa27460086931ef59f")
            assert.equal(expected_uri, uri)
        })
        it("buildSlpUri()", () => {
            let expected_uri = "simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk?amount=10.1&amount1=1.01-fa6c74c52450fc164e17402a46645ce494a8a8e93b1383fa27460086931ef59f"
            let uri = Utils.buildSlpUri("qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk", 10.1, 1.01, "fa6c74c52450fc164e17402a46645ce494a8a8e93b1383fa27460086931ef59f")
            assert.equal(expected_uri, uri)
        })
        it("buildSlpUri()", () => {
            let f = function() {
                Utils.buildSlpUri("abc")
            }
            assert.throws(f, Error("Not a valid SLP address"))
        })
        it("buildSlpUri()", () => {
            let f = function() {
                Utils.buildSlpUri("qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk", undefined, 1.01)
            }
            assert.throws(f, Error("Missing tokenId parameter"))
        })
        it("buildSlpUri()", () => {
            let f = function() {
                Utils.buildSlpUri("qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk", undefined, 1.01, "abc");
            }
            assert.throws(f, Error("TokenId is invalid, must be 32-byte hexidecimal string"))
        })
        it("parseSlpUri()", () => {
            let uri = "simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk"
            let r = Utils.parseSlpUri(uri);
            let r_expected: SlpPaymentRequest = {
                address: "simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk"
            }
            assert.deepEqual(r, r_expected)
        })
        it("parseSlpUri()", () => {
            let uri = "simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk?amount=1.01&amount1=10.123-fa6c74c52450fc164e17402a46645ce494a8a8e93b1383fa27460086931ef59f"
            let r = Utils.parseSlpUri(uri);
            let r_expected: SlpPaymentRequest = {
                address: "simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk",
                amountBch: 1.01, 
                amountToken: 10.123, 
                tokenId: "fa6c74c52450fc164e17402a46645ce494a8a8e93b1383fa27460086931ef59f"
            }
            assert.deepEqual(r, r_expected)
        })
        it("parseSlpUri()", () => {
            let uri = "simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk?amount=10.123-fa6c74c52450fc164e17402a46645ce494a8a8e93b1383fa27460086931ef59f"
            let r = Utils.parseSlpUri(uri);
            let r_expected: SlpPaymentRequest = {
                address: "simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk",
                amountToken: 10.123, 
                tokenId: "fa6c74c52450fc164e17402a46645ce494a8a8e93b1383fa27460086931ef59f"
            }
            assert.deepEqual(r, r_expected)
        })
        it("parseSlpUri()", () => {
            let uri = "simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk?amount=10.123"
            let r = Utils.parseSlpUri(uri);
            let r_expected: SlpPaymentRequest = {
                address: "simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk",
                amountBch: 10.123
            }
            assert.deepEqual(r, r_expected)
        })
        it("parseSlpUri()", () => {
            let f = function() {
                let uri = "simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk?amount=10.123-abch"
                Utils.parseSlpUri(uri)
            }
            assert.throws(f, Error("Token id in URI is not a valid 32-byte hexidecimal string"))
        })
        it("parseSlpUri()", () => {
            let f = function() {
                let uri = "simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk?amount=10.123-fa6c74c52450fc164e17402a46645ce494a8a8e93b1383fa27460086931ef59f-isgroup"
                Utils.parseSlpUri(uri)
            }
            assert.throws(f, Error("Token flags params not yet implemented."))
        })
        it("parseSlpUri()", () => {
            let f = function() {
                let uri = "simpleledger:qra3uard8aqxxc9tswlsugad9x0uglyehc74puah4w?amount=10.123-fa6c74c52450fc164e17402a46645ce494a8a8e93b1383fa27460086931ef59f"
                Utils.parseSlpUri(uri)
            }
            assert.throws(f, Error("Address is not an SLP formatted address."))
        })
        it("parseSlpUri()", () => {
            let f = function() {
                let uri = "simpleledger:qra3uard8aqxxc9tswlsugad9x0uglyehc74puah4w?amount=10.123?fa6c74c52450fc164e17402a46645ce494a8a8e93b1383fa27460086931ef59f-isgroup"
                Utils.parseSlpUri(uri)
            }
            assert.throws(f, Error("Cannot have character '?' more than once."))
        })
        it("parseSlpUri()", () => {
            let f = function() {
                let uri = "bitcoincash:qra3uard8aqxxc9tswlsugad9x0uglyehc74puah4w?amount=10.123"
                Utils.parseSlpUri(uri)
            }
            assert.throws(f, Error("Input does not start with 'simpleledger:'"))
        })
        it("slpAddressFromHash160()", () => {
            let hash160 = Buffer.from("e9d42fb8b90cc1b8dcf698280bb3a066ce08876f", 'hex')
            let network = "mainnet"; // or "testnet"
            let type = "p2pkh";      // or "p2sh"
            let addr = Utils.slpAddressFromHash160(hash160, network, type);
            assert.equal(addr, "simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk")
        })
        it("toLegacyAddress()", () => {
            let addr = Utils.toLegacyAddress("simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk")
            assert.equal(addr, "1NKNdfgPq1EApuNaf5mrNRUPbwVHQt3MeB")
        })
        it("isLegacyAddress()", () => {
            let addr = Utils.isLegacyAddress("1NKNdfgPq1EApuNaf5mrNRUPbwVHQt3MeB")
            assert.equal(addr, true)
        })
        it("isLegacyAddress()", () => {
            let addr = Utils.isLegacyAddress("simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk")
            assert.equal(addr, false)
        })
        it("isLegacyAddress()", () => {
            let addr = Utils.isLegacyAddress("TEST")
            assert.equal(addr, false)
        })
        it("toCashAddress()", () => {
            let addr = Utils.toCashAddress("simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk")
            assert.equal(addr, "bitcoincash:qr5agtachyxvrwxu76vzszan5pnvuzy8dumh7ynrwg")
        })
        it("isCashAddress()", () => {
            let addr = Utils.isCashAddress("bitcoincash:qr5agtachyxvrwxu76vzszan5pnvuzy8dumh7ynrwg")
            assert.equal(addr, true)
        })
        it("isCashAddress()", () => {
            let addr = Utils.isCashAddress("simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk")
            assert.equal(addr, false)
        })
        it("isCashAddress()", () => {
            let addr = Utils.isCashAddress("TEST")
            assert.equal(addr, false)
        })
        it("toSlpAddress()", () => {
            let addr = Utils.toSlpAddress("bitcoincash:qr5agtachyxvrwxu76vzszan5pnvuzy8dumh7ynrwg")
            assert.equal(addr, "simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk")
        })
        it("isSlpAddress()", () => {
            let addr = Utils.isSlpAddress("bitcoincash:qr5agtachyxvrwxu76vzszan5pnvuzy8dumh7ynrwg")
            assert.equal(addr, false)
        })
        it("isSlpAddress()", () => {
            let addr = Utils.isSlpAddress("simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk")
            assert.equal(addr, true)
        })
        it("isSlpAddress()", () => {
            let addr = Utils.isSlpAddress("TEST")
            assert.equal(addr, false)
        })
        it("isLegacyAddress()", () => {
            let addr = Utils.isLegacyAddress("bitcoincash:qr5agtachyxvrwxu76vzszan5pnvuzy8dumh7ynrwg")
            assert.equal(addr, false)
        })
        it("isLegacyAddress()", () => {
            let addr = Utils.isLegacyAddress("1NKNdfgPq1EApuNaf5mrNRUPbwVHQt3MeB")
            assert.equal(addr, true)
        })
        it("isLegacyAddress()", () => {
            let addr = Utils.isLegacyAddress("TEST")
            assert.equal(addr, false)
        })
        it("isMainnet()", () => {
            let addr = Utils.isMainnet("simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk")
            assert.equal(addr, true)
        })
        it("isMainnet()", () => {
            let addr = Utils.isMainnet("bitcoincash:qr5agtachyxvrwxu76vzszan5pnvuzy8dumh7ynrwg")
            assert.equal(addr, true)
        })
        it("isMainnet()", () => {
            let addr = Utils.isMainnet("1M57AyZWUxEA5ihv3vUcF3GrRKZqFN9vMT")
            assert.equal(addr, true)
        })
        it("isMainnet()", () => {
            let addr = Utils.isMainnet("qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk")
            assert.equal(addr, true)
        })
        it("isMainnet()", () => {
            let addr = Utils.isMainnet("qr5agtachyxvrwxu76vzszan5pnvuzy8dumh7ynrwg")
            assert.equal(addr, true)
        })
        it("isMainnet()", () => {
            let addr = Utils.isMainnet("slptest:qpwyc9jnwckntlpuslg7ncmhe2n423304ueqcyw80l")
            assert.equal(addr, false)
        })
        it("isMainnet()", () => {
            let addr = Utils.isMainnet("bchtest:qpwyc9jnwckntlpuslg7ncmhe2n423304uz5ll5saz")
            assert.equal(addr, false)
        })
        it("isMainnet()", () => {
            let addr = Utils.isMainnet("movycLMazxTqG3LcPGNPRaTabi8dK4eKTX")
            assert.equal(addr, false)
        })
        it("isMainnet()", () => {
            let addr = Utils.isMainnet("qpwyc9jnwckntlpuslg7ncmhe2n423304ueqcyw80l")
            assert.equal(addr, false)
        })
        it("isMainnet()", () => {
            let addr = Utils.isMainnet("qpwyc9jnwckntlpuslg7ncmhe2n423304uz5ll5saz")
            assert.equal(addr, false)
        })
    })
})
