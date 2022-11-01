# note: expected build context is the git root directory
FROM node:18-alpine AS build

# ENV DEBIAN_FRONTEND=noninteractive
# ENV NODE_OPTIONS --openssl-legacy-provider
# ENV TZ=UTC

RUN apk add bash

ADD admin-api-server/ /build
ADD lib/ /lib/

RUN mkdir /build/yarn_links

WORKDIR /build
ENV YARN_LINK_ARGS='--link-folder /build/yarn_links'
RUN yarn install
RUN yarn build


FROM node:18-alpine
RUN apk add postgresql-client bash

# these are added to allow the admin-api to check whether the store-db
# has finished it's setup (whether all migrations have been applied),
# before continuing with subscribing to the replication subscription
ADD store-api-server/script/shmig /store-api-server/script/shmig
ADD store-api-server/migrations /store-api-server/migrations

COPY --from=build /build /build
COPY --from=build /lib /lib

WORKDIR /build
ENTRYPOINT yarn start:prod
