#!/usr/bin/env bash
cd $(git rev-parse --show-toplevel)/admin-api-server/lib

# Note: this script expects that the postgres database has already been prepared
# 	and is up

yarn install || exit 1
yarn build || exit 1
yarn link || exit 1

cd $(git rev-parse --show-toplevel)/admin-api-server
yarn link roles_stm || exit 1
yarn install || exit 1
yarn build || exit 1

set -a
source .env || exit 1

./script/migrate up || exit 1
yarn seed 2>/dev/null
