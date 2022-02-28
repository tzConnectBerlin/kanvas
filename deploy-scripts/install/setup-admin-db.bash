#!/usr/bin/env bash
cd $(git rev-parse --show-toplevel)/admin-api-server

set -a
. .env || exit 1
set +a

INIT_QUEPASA=false ./script/migrate || exit 1
./script/setup-replication-sub
