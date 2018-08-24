// https://github.com/simpleledger/slp-lib-js
// Copyright (c) 2017 Emilio Almansi
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

const shell = require('shelljs');
shell.config.fatal = true;

shell.exec('rm -rf dist');
shell.exec('npm run build');
shell.exec('git add -A dist');
shell.exec('npx mustache package.json README.tpl.md', { silent: true }).to('README.md');
shell.exec('git add -A README.md');