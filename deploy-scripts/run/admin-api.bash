#!/usr/bin/env bash
cd $(git rev-parse --show-toplevel)/admin-api-server

yarn run start:prod 2>&1 | tee logs.txt
