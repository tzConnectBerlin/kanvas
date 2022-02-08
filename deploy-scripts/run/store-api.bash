#!/usr/bin/env bash
cd $(git rev-parse --show-toplevel)/store-api-server

./script/run start
