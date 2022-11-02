# note: expected build context is the git root directory
FROM node:18-alpine
# ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_OPTIONS --openssl-legacy-provider
# ENV TZ=UTC

RUN apk add bash

ADD store-front /build

WORKDIR /build

RUN yarn global add serve

RUN yarn install
RUN yarn build

ENTRYPOINT yarn start:prod
