# note: expected build context is the git root directory
FROM node:18-alpine AS build
RUN apk add bash

WORKDIR /build
ENV YARN_LINK_ARGS='--link-folder /build/yarn_links'
ENV NODE_ENV=production

ADD store-api-server/ .
ADD lib/ /lib/

RUN mkdir yarn_links
RUN yarn install --frozen-lockfile --link-duplicates
RUN yarn build

# To use only usefull files
RUN mkdir result &&\
    mv package.json result/ &&\
    mv db_procedures result/ &&\
    mv dist result/ &&\
    mv migrations result/ &&\
    mv node_modules result/ &&\
    mv patches result/ &&\
    mv script result/ &&\
    mv types result/ &&\
    mv yarn_links result/

FROM node:18-alpine
RUN apk add postgresql-client bash curl

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs -g nodejs

USER nodejs
WORKDIR /build

ADD --chown=nodejs:nodejs config /config
COPY --chown=nodejs:nodejs --from=build /lib /lib
COPY --chown=nodejs:nodejs --from=build /build/result .

ENTRYPOINT node dist/src/main.js
