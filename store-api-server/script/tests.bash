#!/bin/bash

echo "pwd: $PWD"

export DB_PORT=15431
export DB_HOST=localhost
export DB_USERNAME=testusr
export DB_PASSWORD=testpass
export DB_DATABASE=test

export JWT_EXPIRATION_TIME=86400000
export JWT_SECRET='wPK-TfcjDSjztKrb4SUnfRPQ1YIovrooYQaX4h-EnU4'

jest
