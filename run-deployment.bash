#!/bin/bash


export ADMIN_API_ENABLED=no
export STORE_API_ENABLED=yes
export STORE_FRONT_ENABLED=yes
export ADMIN_FRONT_ENABLED=no
export DEPLOYMENT=yes

docker-compose up | tee kanvas.log
