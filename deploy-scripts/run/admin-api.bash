#!/usr/bin/env bash
cd $(git rev-parse --show-toplevel)/admin-api-server

source .env || exit 1

yarn run start
