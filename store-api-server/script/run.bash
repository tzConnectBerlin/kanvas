#!/bin/bash
cd $(git rev-parse --show-toplevel)/store-api-server

export DB_PORT=5432
export DB_HOST=localhost
export DB_USERNAME=quepasa
export DB_PASSWORD=quepasa
export DB_DATABASE=kanvas

export JWT_EXPIRATION_TIME=86400000
export JWT_SECRET='wPK-TfcjDSjztKrb4SUnfRPQ1YIovrooYQaX4h-EnU4'

export KANVAS_API_PORT=4000

script/shmig -t postgresql -d postgres://$DB_USERNAME:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_DATABASE up || exit 1
yarn run start
