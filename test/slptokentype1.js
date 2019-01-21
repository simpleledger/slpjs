const BITBOXSDK = require('../node_modules/bitbox-sdk/lib/bitbox-sdk').default;
const BITBOX = new BITBOXSDK();
const assert = require('assert');

const Slp = require('../lib/slp').Slp;
const scriptUnitTestData = require('../node_modules/slp-unit-test-data/script_tests.json');

// Overall script error codes:
// * 1 - Basic error that prevents even parsing as a bitcoin script (currently, only for truncated scripts).
// * 2 - Disallowed opcodes (after OP_RETURN, only opcodes 0x01 - 0x4e may be used).
// * 3 - Not an SLP message (script is not OP_RETURN, or lacks correct lokad ID). Note in some implementations, the parsers would never be given such non-SLP scripts in the first place. In such implementations, error code 3 tests may be skipped as they are not relevant.

// Reasons relating to the specified limits:
// * 10 - A push chunk has the wrong size.
// * 11 - A push chunk has an illegal value.
// * 12 - A push chunk is missing / there are too few chunks.

// Specific to one particular transaction type:

// * 21 - Too many optional values (currently, only if there are more than 19 token output amounts)

// Other:
// * 255 - The SLP token_type field is has an unsupported value. Depending on perspective this is not 'invalid' per se -- it simply cannot be parsed since the protocol for that token_type is not known. Like error code 3 these tests may not be applicable to some parsers.

describe('SlpTokenType1', function() {
    describe('OP_RETURN Parsing Unit Tests', function() {
        scriptUnitTestData.forEach((test, i)=> {
            let slp = new Slp(BITBOX);
            it(test.msg, () => {
                let script = new Buffer.from(test.script, 'hex');
                let eCode = test.code;
                if(eCode) {
                    assert.throws(function() { slp.parseSlpOutputScript(script) });
                } else {
                    let parsedOutput = slp.parseSlpOutputScript(script);
                    assert(typeof parsedOutput, 'object');
                }
            });
        });
    });
});