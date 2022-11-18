# note: expected build context is the git root directory
FROM node:16-alpine
# ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_OPTIONS --openssl-legacy-provider
# ENV TZ=UTC

WORKDIR /app

RUN apk add bash

ADD store-front .

RUN yarn global add serve && yarn install && yarn build

ENTRYPOINT yarn start:prod
