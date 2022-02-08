#!/usr/bin/env bash
cd $(git rev-parse --show-toplevel)/store-api-server

source .env

./script/setup-replication-pub
