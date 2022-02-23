#!/usr/bin/env bash
cd $(git rev-parse --show-toplevel)/store-api-server

set -a
. .env
set +a

./script/run start:dev | tee logs.txt
