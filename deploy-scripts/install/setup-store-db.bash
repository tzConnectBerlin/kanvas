#!/usr/bin/env bash
cd $(git rev-parse --show-toplevel)/store-api-server

# only necessary to run on first installation

set -a
. .env
set +a

INIT_QUEPASA=true ./script/migrate
