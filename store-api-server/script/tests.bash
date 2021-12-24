#!/bin/bash
cd $(git rev-parse --show-toplevel)/store-api-server

WAIT_TESTDB=3

export DB_PORT=15431
export DB_HOST=localhost
export DB_USERNAME=testusr
export DB_PASSWORD=testpass
export DB_DATABASE=test

export JWT_EXPIRATION_TIME=86400000
export JWT_SECRET='wPK-TfcjDSjztKrb4SUnfRPQ1YIovrooYQaX4h-EnU4'

db_docker=`DOCKER_ARGS='-d' ./script/local-db.bash 2>/dev/null`
if [[ "$?" != "0" ]]; then
    echo failed to start testdb, cannot run tests
    exit 1
fi
trap "docker kill $db_docker" EXIT

echo "sleeping for $WAIT_TESTDB seconds before starting tests for testdb setup.."
sleep $WAIT_TESTDB

jest --detectOpenHandles
