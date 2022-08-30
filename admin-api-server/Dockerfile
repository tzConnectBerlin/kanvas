# note: expected build context is the git root directory
FROM node

ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_OPTIONS --openssl-legacy-provider
ENV TZ=UTC
RUN apt-get update && apt-get upgrade -y

ADD admin-api-server/ /build
ADD lib/ /lib/

# these are added to allow the admin-api to check whether the store-db
# has finished it's setup (whether all migrations have been applied),
# before continuing with subscribing to the replication subscription
ADD store-api-server/script/shmig /store-api-server/script/shmig
ADD store-api-server/migrations /store-api-server/migrations

# need psql
RUN apt update && apt upgrade -y
RUN apt install -y postgresql

RUN mkdir /build/yarn_links

WORKDIR /build
ENV YARN_LINK_ARGS='--link-folder /build/yarn_links'
RUN yarn install
RUN yarn build

ENTRYPOINT yarn start:prod
