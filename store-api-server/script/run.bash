#!/usr/bin/env bash
cd $(git rev-parse --show-toplevel)/store-api-server

command=${1-start}

[ -z $DB_PORT ] && export DB_PORT=5432
[ -z $DB_HOST ] && export DB_HOST=localhost
[ -z $DB_USERNAME ] && export DB_USERNAME=quepasa
[ -z $DB_PASSWORD ] && export DB_PASSWORD=quepasa
[ -z $DB_DATABASE ] && export DB_DATABASE=kanvas

export JWT_EXPIRATION_TIME=86400000
export JWT_SECRET='wPK-TfcjDSjztKrb4SUnfRPQ1YIovrooYQaX4h-EnU4'

[ -z $KANVAS_API_PORT ] && export KANVAS_API_PORT=4000

script/shmig -t postgresql -d postgres://$DB_USERNAME:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_DATABASE up || exit 1
yarn run $command
