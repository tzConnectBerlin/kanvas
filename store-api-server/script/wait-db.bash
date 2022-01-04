#!/usr/bin/env bash

while ! psql -c 'select 1' 2>/dev/null ; do
    echo not up yet..
    sleep 1
done
