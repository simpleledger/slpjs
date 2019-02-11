import { Utils } from '../lib/utils';

import * as assert from 'assert';
import "mocha";

describe('Utils', function() {
    describe('Address Conversion and Network Detection', function() {
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
