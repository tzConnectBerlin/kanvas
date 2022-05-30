#!/usr/bin/env bash
cd $(git rev-parse --show-toplevel)/admin-api-server

yarn run start:prod || tee logs.txt
