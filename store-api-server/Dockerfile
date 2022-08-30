# note: expected build context is the git root directory
FROM node
ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_OPTIONS --openssl-legacy-provider
ENV TZ=UTC

# need psql
RUN apt update && apt upgrade -y
RUN apt install -y postgresql tree

ADD store-api-server/ /build
ADD lib/ /lib/

RUN mkdir /build/yarn_links

WORKDIR /build
ENV YARN_LINK_ARGS='--link-folder /build/yarn_links'
RUN yarn install
RUN yarn build

ENTRYPOINT yarn start
