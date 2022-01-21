# this must be built with context at git root directory
FROM node

ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_OPTIONS --openssl-legacy-provider
ENV TZ=UTC
RUN apt-get update && apt-get upgrade -y

ADD admin-api-server /build/admin-api-server
ADD store-api-server/migrations /build/store-api-server/migrations
ADD store-api-server/script /build/store-api-server/script

# need psql
RUN apt update && apt upgrade -y
RUN apt install -y postgresql

WORKDIR /build/admin-api-server/lib
RUN yarn install && yarn build && yarn link --link-folder /build

WORKDIR /build/admin-api-server
RUN yarn install && yarn link --link-folder /build roles_stm && yarn build

ENTRYPOINT yarn start
