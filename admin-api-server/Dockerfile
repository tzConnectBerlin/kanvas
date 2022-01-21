# this must be built with context at git root directory
FROM node

ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_OPTIONS --openssl-legacy-provider
ENV TZ=UTC
RUN apt-get update && apt-get upgrade -y

ADD . /build

# need psql
RUN apt update && apt upgrade -y
RUN apt install -y postgresql

RUN mkdir /build/yarn_links

WORKDIR /build/lib
RUN yarn install && yarn build && yarn link --link-folder /build/yarn_links

WORKDIR /build
RUN yarn install && yarn link --link-folder /build/yarn_links  roles_stm && yarn build

ENTRYPOINT yarn start
