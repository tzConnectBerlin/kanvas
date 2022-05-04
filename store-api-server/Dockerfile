# note: expected build context is the git root directory
FROM node
ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_OPTIONS --openssl-legacy-provider
ENV TZ=UTC

# need psql
RUN apt update && apt upgrade -y
RUN apt install -y postgresql

ADD store-api-server/ /build
ADD lib/ /build/lib/

RUN mkdir /build/yarn_links

WORKDIR /build/lib/api-lib/
RUN yarn install
RUN yarn build
RUN yarn link --link-folder /build/yarn_links

WORKDIR /build/lib/tezpay/server
RUN yarn link --link-folder /build/yarn_links

WORKDIR /build
RUN yarn install
RUN yarn link --link-folder /build/yarn_links kanvas-api-lib
RUN yarn link --link-folder /build/yarn_links tezpay-server
RUN yarn build

ENTRYPOINT yarn start
