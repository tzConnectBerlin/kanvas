#!/usr/bin/env bash
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
cd $SCRIPT_DIR/..

command=${1-start}

[ -z $PGPORT ] && export PGPORT=5432
[ -z $PGHOST ] && export PGHOST=localhost
[ -z $PGUSER ] && export PGUSER=quepasa
[ -z $PGPASSWORD ] && export PGPASSWORD=quepasa
[ -z $PGDATABASE ] && export PGDATABASE=kanvas

export JWT_EXPIRATION_TIME=86400000
export JWT_SECRET='wPK-TfcjDSjztKrb4SUnfRPQ1YIovrooYQaX4h-EnU4'

[ -z $KANVAS_API_PORT ] && export KANVAS_API_PORT=4000

script/shmig -t postgresql -d postgres://$PGUSER:$PGPASSWORD@$PGHOST:$PGPORT/$PGDATABASE up || exit 1
yarn run $command
