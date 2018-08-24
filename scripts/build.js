// https://github.com/simpleledger/slp-lib-js
// Copyright (c) 2018 James Cramer
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

const version = require('../package.json').version;

const shell = require('shelljs');
shell.config.fatal = true;

shell.exec('mkdir -p dist');

shell.exec('npx browserify src/slp-lib.js --s slp-lib', { silent:true })
  .to(`dist/slp-lib-${version}.js`);
shell.echo(`Generated file: dist/slp-lib-${version}.js.`);

shell.exec(`cp LICENSE.js dist/slp-lib-${version}.min.js`);
shell.exec(`cat dist/slp-lib-${version}.js`, { silent:true })
  .exec('npx uglifyjs -c', { silent:true })
  .toEnd(`dist/slp-lib-${version}.min.js`);
shell.echo(`Generated file: dist/slp-lib-${version}.min.js.`);