# note: expected build context is the git root directory
FROM node:18-alpine AS build

#ENV DEBIAN_FRONTEND=noninteractive
#ENV NODE_OPTIONS --openssl-legacy-provider
#ENV TZ=UTC

# need psql
#RUN apt update
#RUN apt install -y postgresql

RUN apk add bash

ADD store-api-server/ /build
ADD lib/ /lib/
ADD config/ /config

RUN mkdir /build/yarn_links

WORKDIR /build
ENV YARN_LINK_ARGS='--link-folder /build/yarn_links'
ENV NODE_ENV=production
RUN yarn install --frozen-lockfile
RUN yarn build

FROM node:18-alpine

COPY --from=build /build/yarn_links /build/yarn_links

COPY --from=build /lib/api-lib/node_modules /lib/api-lib/node_modules
COPY --from=build /lib/api-lib/dist /lib/api-lib/dist
COPY --from=build /lib/api-lib/package.json /lib/api-lib/package.json

COPY --from=build /lib/tezpay /lib/tezpay

COPY --from=build /lib/token-gate/node_modules /lib/token-gate/node_modules
COPY --from=build /lib/token-gate/dist /lib/token-gate/dist
COPY --from=build /lib/token-gate/package.json /lib/token-gate/package.json

COPY --from=build /config /config

RUN apk add postgresql-client bash

WORKDIR /build

COPY --from=build /build/node_modules node_modules/
COPY --from=build /build/dist dist/
COPY --from=build /build/script script/
COPY --from=build /build/migrations migrations/
COPY --from=build /build/db_procedures db_procedures/
COPY --from=build /build/package.json .

ENTRYPOINT yarn start:prod
