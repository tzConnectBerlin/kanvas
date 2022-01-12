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
    process=`docker ps | grep $PGPORT | awk '{print $1}'`
    docker kill $process
    echo failed to start testdb, cannot run tests
    exit 1
fi
trap "docker kill $db_docker" EXIT

echo "waiting for testdb setup.."
./script/wait-db.bash
sleep 1  # sleeping for 1 more second, for db migrations to finish

echo "running tests.."

mkdir -p test/coverage
jest "$@" --coverage > test/coverage/summary.txt || exit 1
sed -n '/^-----/ { :a; n; p; ba; }' test/coverage/summary.txt | head -n 3 | awk -F '|' '{print $2 $3 $4 $5}'
