#!/usr/bin/env bash
REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"/store-api-server

PEPPERMINT_VERSION=ee538be4d156ffb456107587eb71f14671afb1c7
[ -z $PGPORT ] && export PGPORT=5432
[ -z $PGPASSWORD ] && export PGPASSWORD=dev_password
[ -z $PGUSER ] && export PGUSER=dev_user
[ -z $PGDATABASE ] && export PGDATABASE=dev_database
[ -z $PGHOST ] && export PGHOST=localhost

docker image pull ghcr.io/tzconnectberlin/que-pasa:1.0.7 >/dev/null || exit 1

(
    ./script/wait-db.bash

    # to set up the database schema of onchain_kanvas:
    (
        source "$REPO_ROOT"/config/.env-kanvas
        export DATABASE_URL="host=$PGHOST dbname=$PGDATABASE user=$PGUSER password=$PGPASSWORD port=$PGPORT"
        docker run \
            --network host \
            -v "$REPO_ROOT"/config:/config \
            -e NODE_URL=$NODE_URL \
            -e DATABASE_URL="$DATABASE_URL" \
            ghcr.io/tzconnectberlin/que-pasa:1.0.7 \
            --contract-settings /config/kanvas.yaml -l 0
    ) 2>&1 >/dev/null &

    curl "https://raw.githubusercontent.com/tzConnectBerlin/peppermint/${PEPPERMINT_VERSION}/database/schema.sql" 2>/dev/null | psql || exit 1

    ./script/shmig -t postgresql -d postgres://$PGUSER:$PGPASSWORD@$PGHOST:$PGPORT/$PGDATABASE up || exit 1

    psql < script/populate-testdb.sql
) >/dev/null &

[ -z $DOCKER_ARGS ] && export DOCKER_ARGS='-t'

docker run ${DOCKER_ARGS} \
    -p $PGPORT:5432 \
    -e POSTGRES_PASSWORD=$PGPASSWORD \
    -e POSTGRES_USER=$PGUSER \
    -e POSTGRES_DB=$PGDATABASE \
    postgres \
        -c wal_level=logical \
        "$@"
