#!/bin/bash
cd $(git rev-parse --show-toplevel)/store-front

export NODE_OPTIONS=--openssl-legacy-provider
~/.yarn/bin/serve -s build
