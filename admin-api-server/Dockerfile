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

COPY --from=build /build/yarn_links /build/yarn_links

COPY --from=build /lib/api-lib/node_modules /lib/api-lib/node_modules
COPY --from=build /lib/api-lib/dist /lib/api-lib/dist
COPY --from=build /lib/api-lib/package.json /lib/api-lib/package.json

COPY --from=build /build/stm-lib/node_modules /build/stm-lib/node_modules
COPY --from=build /build/stm-lib/dist /build/stm-lib/dist
COPY --from=build /build/stm-lib/package.json /build/stm-lib/package.json

WORKDIR /build

COPY --from=build /build/node_modules node_modules/
COPY --from=build /build/dist dist/
COPY --from=build /build/script script/
COPY --from=build /build/migrations migrations/
COPY --from=build /build/package.json .
COPY --from=build /build/config config/

ENTRYPOINT yarn start:prod
