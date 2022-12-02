#!/usr/bin/env bash
cd $(git rev-parse --show-toplevel)/store-api-server

set -a
. .env
set +a

script/entrypoint 2>&1 | tee --append logs.txt
