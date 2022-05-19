# note: expected build context is the git root directory
FROM node
ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_OPTIONS --openssl-legacy-provider
ENV TZ=UTC

ADD . /build

WORKDIR /build

RUN yarn install
RUN yarn build

ENTRYPOINT yarn start:prod
