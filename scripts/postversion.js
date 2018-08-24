// https://github.com/simpleledger/slp-lib-js
// Copyright (c) 2017 Emilio Almansi
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

const shell = require('shelljs');
shell.config.fatal = true;

shell
  .exec('git push')
  .exec('git push --tags')
  .exec('npm publish');