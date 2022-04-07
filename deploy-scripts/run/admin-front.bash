#!/bin/bash
cd $(git rev-parse --show-toplevel)/admin-front

. .env

export NODE_OPTIONS=--openssl-legacy-provider
~/.yarn/bin/serve -s build -l $REACT_APP_PORT
