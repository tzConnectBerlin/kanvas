#!/usr/bin/env bash
cd $(git rev-parse --show-toplevel)/admin-front

yarn global add serve || exit 1

yarn install || exit 1

# workaround for this: https://github.com/webpack/webpack/issues/14532
# seems to be no other way to "fix" this than this workaround right now
#export NODE_OPTIONS=--openssl-legacy-provider

yarn build || exit 1
