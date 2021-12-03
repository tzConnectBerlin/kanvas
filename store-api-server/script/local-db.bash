#!/bin/bash
cd $(git rev-parse --show-toplevel)/store-api-server

[ -z $DB_PORT ] && export DB_PORT=5432
[ -z $DB_PASSWORD ] && export DB_PASSWORD=dev_password
[ -z $DB_USERNAME ] && export DB_USERNAME=dev_user
[ -z $DB_DATABASE ] && export DB_DATABASE=dev_database
[ -z $DB_HOST ] && export DB_HOST=localhost

BOOT_TIME=3s
(
    sleep $BOOT_TIME;
    ./script/shmig -t postgresql -d postgres://$DB_USERNAME:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_DATABASE up || exit 1

    PGUSER=$DB_USERNAME \
        PGPASSWORD=$DB_PASSWORD \
        PGHOST=$DB_HOST \
        PGPORT=$DB_PORT \
        PGDATABASE=$DB_DATABASE \
        psql < script/populate-testdb.sql
) &

docker run -ti \
    -p $DB_PORT:5432 \
    -e POSTGRES_PASSWORD=$DB_PASSWORD \
    -e POSTGRES_USER=$DB_USERNAME \
    -e POSTGRES_DB=$DB_DATABASE \
    postgres "$@"
