#!/bin/bash

[ -z $PGPORT ] && export PGPORT=5432
[ -z $PGPASSWORD ] && export PGPASSWORD=dev_password
[ -z $PGUSER ] && export PGUSER=dev_user
[ -z $PGDATABASE ] && export PGDATABASE=dev_database

docker run \
    -p $PGPORT:5432 \
    -e POSTGRES_PASSWORD=$PGPASSWORD \
    -e POSTGRES_USER=$PGUSER \
    -e POSTGRES_DB=$PGDATABASE \
    postgres "$@"
