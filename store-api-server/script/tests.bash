#!/usr/bin/env bash
cd $(git rev-parse --show-toplevel)/store-api-server

export PGPORT=15431
export PGHOST=localhost
export PGUSER=testusr
export PGPASSWORD=testpass
export PGDATABASE=test

export JWT_EXPIRATION_TIME=86400000
export JWT_SECRET='wPK-TfcjDSjztKrb4SUnfRPQ1YIovrooYQaX4h-EnU4'

db_docker=`DOCKER_ARGS='-d' ./script/local-db.bash 2>/dev/null`
if [[ "$?" != "0" ]]; then
    echo failed to start testdb, cannot run tests
    exit 1
fi
trap "docker kill $db_docker" EXIT

echo "waiting for testdb setup.."
./script/wait-db.bash
sleep 1  # sleeping for 1 more second, for db migrations to finish

echo "running with '$@'"

jest "$@" --coverage --coverageReporters="text-summary" # --detectOpenHandles
