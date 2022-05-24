#!/usr/bin/env bash
cd $(git rev-parse --show-toplevel)/lib/api-lib

yarn install || exit 1
yarn build || exit 1
yarn link || exit 1

cd $(git rev-parse --show-toplevel)/lib/tezpay/server

yarn install || exit 1
yarn link || exit 1

cd ../../../store-api-server

yarn link kanvas-api-lib || exit 1
yarn link tezpay-server || exit 1
yarn install || exit 1
yarn build || exit 1

set -a
. .env
set +a

INIT_QUEPASA=false ./script/migrate
