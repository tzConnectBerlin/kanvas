#!/usr/bin/env bash
cd $(git rev-parse --show-toplevel)/store-api-server

yarn install || exit 1
yarn build
