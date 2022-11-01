# note: expected build context is the git root directory
FROM node:18-alpine AS build
RUN apk add bash

ADD admin-api-server/ /build
ADD lib/ /lib/

RUN mkdir /build/yarn_links

WORKDIR /build
ENV YARN_LINK_ARGS='--link-folder /build/yarn_links'
RUN yarn install --frozen-lockfile --link-duplicates
RUN yarn build


FROM node:18-alpine
RUN apk add postgresql-client bash

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs -g nodejs

# these are added to allow the admin-api to check whether the store-db
# has finished it's setup (whether all migrations have been applied),
# before continuing with subscribing to the replication subscription
ADD --chown=nodejs:nodejs store-api-server/script/shmig /store-api-server/script/shmig
ADD --chown=nodejs:nodejs store-api-server/migrations /store-api-server/migrations

COPY --chown=nodejs:nodejs --from=build /build /build
COPY --chown=nodejs:nodejs --from=build /lib /lib

USER nodejs
WORKDIR /build
ENTRYPOINT yarn start:prod
