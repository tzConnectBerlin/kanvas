#!/usr/bin/env node

const program = require('commander');
import * as ver from './ver';
import * as contract from './contract';

program
    .command('compile-contract')
    .action(contract.compileContract)

program
    .command('deploy-contract')
    .action(contract.deployContract)

program
    .option('-v', 'show version', ver, '')
    .action(ver.showVersion);

program.parse(process.argv)