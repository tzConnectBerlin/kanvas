#!/usr/bin/env bash
cd $(git rev-parse --show-toplevel)/lib/api-lib

yarn install || exit 1
yarn build || exit 1
yarn link || exit 1

cd $(git rev-parse --show-toplevel)/admin-api-server/stm-lib

# Note: this script expects that the postgres database has already been prepared
# 	and is up

yarn install || exit 1
yarn build || exit 1
yarn link || exit 1

cd $(git rev-parse --show-toplevel)/admin-api-server
yarn link kanvas-stm-lib || exit 1
yarn link kanvas-api-lib || exit 1
yarn install || exit 1
yarn build || exit 1

set -a
. .env

INIT_QUEPASA=false ./script/migrate || exit 1
yarn seed 2>/dev/null
