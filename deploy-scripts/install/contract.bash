#!/usr/bin/env bash
cd $(git rev-parse --show-toplevel)/smart-contract-helper

# yarn install
yarn install -g || exit 1
yarn build || exit 1
yarn run smart-contract.helper compile-contract || exit 1
yarn run smart-contract.helper deploy-contract
