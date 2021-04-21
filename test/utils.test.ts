import * as assert from "assert";
import "mocha";
import { SlpPaymentRequest } from "..";
import { Utils } from "../lib/utils";

describe("Utils", () => {
    describe("Address Conversion and Network Detection", () => {
        it("buildSlpUri()", () => {
            const expectedUri = "simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk";
            const uri = Utils.buildSlpUri("qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk");
            assert.equal(expectedUri, uri);
        });
        it("buildSlpUri()", () => {
            const expectedUri = "simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk";
            const uri = Utils.buildSlpUri("simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk");
            assert.equal(expectedUri, uri);
        });
        it("buildSlpUri()", () => {
            const expectedUri = "simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk?amount=10.1";
            const uri = Utils.buildSlpUri("qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk", 10.1);
            assert.equal(expectedUri, uri);
        });
        it("buildSlpUri()", () => {
            const expectedUri = "simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk?amount=1.01-fa6c74c52450fc164e17402a46645ce494a8a8e93b1383fa27460086931ef59f";
            const uri = Utils.buildSlpUri("qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk", undefined, 1.01, "fa6c74c52450fc164e17402a46645ce494a8a8e93b1383fa27460086931ef59f");
            assert.equal(expectedUri, uri);
        });
        it("buildSlpUri()", () => {
            const expectedUri = "simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk?amount=10.1&amount1=1.01-fa6c74c52450fc164e17402a46645ce494a8a8e93b1383fa27460086931ef59f";
            const uri = Utils.buildSlpUri("qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk", 10.1, 1.01, "fa6c74c52450fc164e17402a46645ce494a8a8e93b1383fa27460086931ef59f");
            assert.equal(expectedUri, uri);
        });
        it("buildSlpUri()", () => {
            const f = () => {
                Utils.buildSlpUri("abc");
            };
            assert.throws(f, Error("Not a valid SLP address"));
        });
        it("buildSlpUri()", () => {
            const f = () => {
                Utils.buildSlpUri("qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk", undefined, 1.01);
            };
            assert.throws(f, Error("Missing tokenId parameter"));
        });
        it("buildSlpUri()", () => {
            const f = () => {
                Utils.buildSlpUri("qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk", undefined, 1.01, "abc");
            };
            assert.throws(f, Error("TokenId is invalid, must be 32-byte hexidecimal string"));
        });
        it("parseSlpUri()", () => {
            const uri = "simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk";
            const r = Utils.parseSlpUri(uri);
            const rExpected: SlpPaymentRequest = {
                address: "simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk",
            };
            assert.deepEqual(r, rExpected);
        });
        it("parseSlpUri()", () => {
            const uri = "simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk?amount=1.01&amount1=10.123-fa6c74c52450fc164e17402a46645ce494a8a8e93b1383fa27460086931ef59f";
            const r = Utils.parseSlpUri(uri);
            const rExpected: SlpPaymentRequest = {
                address: "simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk",
                amountBch: 1.01,
                amountToken: 10.123,
                tokenId: "fa6c74c52450fc164e17402a46645ce494a8a8e93b1383fa27460086931ef59f",
            };
            assert.deepEqual(r, rExpected);
        });
        it("parseSlpUri()", () => {
            const uri = "simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk?amount=10.123-fa6c74c52450fc164e17402a46645ce494a8a8e93b1383fa27460086931ef59f";
            const r = Utils.parseSlpUri(uri);
            const rExpected: SlpPaymentRequest = {
                address: "simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk",
                amountToken: 10.123,
                tokenId: "fa6c74c52450fc164e17402a46645ce494a8a8e93b1383fa27460086931ef59f",
            };
            assert.deepEqual(r, rExpected);
        });
        it("parseSlpUri()", () => {
            const uri = "simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk?amount=10.123";
            const r = Utils.parseSlpUri(uri);
            const rExpected: SlpPaymentRequest = {
                address: "simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk",
                amountBch: 10.123,
            };
            assert.deepEqual(r, rExpected);
        });
        it("parseSlpUri()", () => {
            const f = () => {
                const uri = "simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk?amount=10.123-abch";
                Utils.parseSlpUri(uri);
            };
            assert.throws(f, Error("Token id in URI is not a valid 32-byte hexidecimal string"));
        });
        it("parseSlpUri()", () => {
            const f = () => {
                const uri = "simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk?amount=10.123-fa6c74c52450fc164e17402a46645ce494a8a8e93b1383fa27460086931ef59f-isgroup";
                Utils.parseSlpUri(uri);
            };
            assert.throws(f, Error("Token flags params not yet implemented."));
        });
        it("parseSlpUri()", () => {
            const f = () => {
                const uri = "simpleledger:qra3uard8aqxxc9tswlsugad9x0uglyehc74puah4w?amount=10.123-fa6c74c52450fc164e17402a46645ce494a8a8e93b1383fa27460086931ef59f";
                Utils.parseSlpUri(uri);
            };
            assert.throws(f, Error("Address is not an SLP formatted address."));
        });
        it("parseSlpUri()", () => {
            const f = () => {
                const uri = "simpleledger:qra3uard8aqxxc9tswlsugad9x0uglyehc74puah4w?amount=10.123?fa6c74c52450fc164e17402a46645ce494a8a8e93b1383fa27460086931ef59f-isgroup";
                Utils.parseSlpUri(uri);
            };
            assert.throws(f, Error("Cannot have character '?' more than once."));
        });
        it("parseSlpUri()", () => {
            const f = () => {
                const uri = "bitcoincash:qra3uard8aqxxc9tswlsugad9x0uglyehc74puah4w?amount=10.123";
                Utils.parseSlpUri(uri);
            };
            assert.throws(f, Error("Input does not start with 'simpleledger:'"));
        });
        it("slpAddressFromHash160()", () => {
            const hash160 = Buffer.from("e9d42fb8b90cc1b8dcf698280bb3a066ce08876f", "hex");
            const network = "mainnet"; // or "testnet"
            const type = "p2pkh";      // or "p2sh"
            const addr = Utils.slpAddressFromHash160(hash160, network, type);
            assert.equal(addr, "simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk");
        });
        it("toLegacyAddress()", () => {
            const addr = Utils.toLegacyAddress("simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk");
            assert.equal(addr, "1NKNdfgPq1EApuNaf5mrNRUPbwVHQt3MeB");
        });
        it("isLegacyAddress()", () => {
            const addr = Utils.isLegacyAddress("1NKNdfgPq1EApuNaf5mrNRUPbwVHQt3MeB");
            assert.equal(addr, true);
        });
        it("isLegacyAddress()", () => {
            const addr = Utils.isLegacyAddress("simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk");
            assert.equal(addr, false);
        });
        it("isLegacyAddress()", () => {
            const addr = Utils.isLegacyAddress("TEST");
            assert.equal(addr, false);
        });
        it("toCashAddress()", () => {
            const addr = Utils.toCashAddress("simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk");
            assert.equal(addr, "bitcoincash:qr5agtachyxvrwxu76vzszan5pnvuzy8dumh7ynrwg");
        });
        it("toSlpRegtestAddress()", () => {
            const addr = Utils.toSlpRegtestAddress("simpleledger:qph5kuz78czq00e3t85ugpgd7xmer5kr7ccj3fcpsg");
            assert.equal(addr, "slpreg:qph5kuz78czq00e3t85ugpgd7xmer5kr7ch8j98fn9");
        });
        it("isCashAddress()", () => {
            const addr = Utils.isCashAddress("bitcoincash:qr5agtachyxvrwxu76vzszan5pnvuzy8dumh7ynrwg");
            assert.equal(addr, true);
        });
        it("isCashAddress()", () => {
            const addr = Utils.isCashAddress("simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk");
            assert.equal(addr, false);
        });
        it("isCashAddress()", () => {
            const addr = Utils.isCashAddress("TEST");
            assert.equal(addr, false);
        });
        it("toSlpAddress()", () => {
            const addr = Utils.toSlpAddress("bitcoincash:qr5agtachyxvrwxu76vzszan5pnvuzy8dumh7ynrwg");
            assert.equal(addr, "simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk");
        });
        it("isSlpAddress()", () => {
            const addr = Utils.isSlpAddress("bitcoincash:qr5agtachyxvrwxu76vzszan5pnvuzy8dumh7ynrwg");
            assert.equal(addr, false);
        });
        it("isSlpAddress()", () => {
            const addr = Utils.isSlpAddress("simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk");
            assert.equal(addr, true);
        });
        it("isSlpAddress()", () => {
            const addr = Utils.isSlpAddress("TEST");
            assert.equal(addr, false);
        });
        it("isLegacyAddress()", () => {
            const addr = Utils.isLegacyAddress("bitcoincash:qr5agtachyxvrwxu76vzszan5pnvuzy8dumh7ynrwg");
            assert.equal(addr, false);
        });
        it("isLegacyAddress()", () => {
            const addr = Utils.isLegacyAddress("1NKNdfgPq1EApuNaf5mrNRUPbwVHQt3MeB");
            assert.equal(addr, true);
        });
        it("isLegacyAddress()", () => {
            const addr = Utils.isLegacyAddress("TEST");
            assert.equal(addr, false);
        });
        it("isMainnet()", () => {
            const addr = Utils.isMainnet("simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk");
            assert.equal(addr, true);
        });
        it("isMainnet()", () => {
            const addr = Utils.isMainnet("bitcoincash:qr5agtachyxvrwxu76vzszan5pnvuzy8dumh7ynrwg");
            assert.equal(addr, true);
        });
        it("isMainnet()", () => {
            const addr = Utils.isMainnet("1M57AyZWUxEA5ihv3vUcF3GrRKZqFN9vMT");
            assert.equal(addr, true);
        });
        it("isMainnet()", () => {
            const addr = Utils.isMainnet("qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk");
            assert.equal(addr, true);
        });
        it("isMainnet()", () => {
            const addr = Utils.isMainnet("qr5agtachyxvrwxu76vzszan5pnvuzy8dumh7ynrwg");
            assert.equal(addr, true);
        });
        it("isMainnet()", () => {
            const addr = Utils.isMainnet("slptest:qpwyc9jnwckntlpuslg7ncmhe2n423304ueqcyw80l");
            assert.equal(addr, false);
        });
        it("isMainnet()", () => {
            const addr = Utils.isMainnet("bchtest:qpwyc9jnwckntlpuslg7ncmhe2n423304uz5ll5saz");
            assert.equal(addr, false);
        });
        it("isMainnet()", () => {
            const addr = Utils.isMainnet("movycLMazxTqG3LcPGNPRaTabi8dK4eKTX");
            assert.equal(addr, false);
        });
        it("isMainnet()", () => {
            const addr = Utils.isMainnet("qpwyc9jnwckntlpuslg7ncmhe2n423304ueqcyw80l");
            assert.equal(addr, false);
        });
        it("isMainnet()", () => {
            const addr = Utils.isMainnet("qpwyc9jnwckntlpuslg7ncmhe2n423304uz5ll5saz");
            assert.equal(addr, false);
        });
    });
});
