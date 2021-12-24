#!/bin/bash
cd $(git rev-parse --show-toplevel)/store-api-server

# Note: this script expects peppermint repo to be in repo-root/../peppermint

[ -z $DB_PORT ] && export DB_PORT=5432
[ -z $DB_PASSWORD ] && export DB_PASSWORD=dev_password
[ -z $DB_USERNAME ] && export DB_USERNAME=dev_user
[ -z $DB_DATABASE ] && export DB_DATABASE=dev_database
[ -z $DB_HOST ] && export DB_HOST=localhost

BOOT_TIME=3s
(
    sleep $BOOT_TIME;

    export PGUSER=$DB_USERNAME
    export PGPASSWORD=$DB_PASSWORD
    export PGHOST=$DB_HOST
    export PGPORT=$DB_PORT
    export PGDATABASE=$DB_DATABASE

    psql < ../../peppermint/database/schema.sql

    ./script/shmig -t postgresql -d postgres://$DB_USERNAME:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_DATABASE up || exit 1

    psql < script/populate-testdb.sql
) >/dev/null &

[ -z $DOCKER_ARGS ] && export DOCKER_ARGS='-t'

docker run ${DOCKER_ARGS} \
    -p $DB_PORT:5432 \
    -e POSTGRES_PASSWORD=$DB_PASSWORD \
    -e POSTGRES_USER=$DB_USERNAME \
    -e POSTGRES_DB=$DB_DATABASE \
    postgres "$@"
