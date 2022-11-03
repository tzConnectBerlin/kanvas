# note: expected build context is the git root directory
FROM node:18-alpine AS build
RUN apk add bash

ADD store-api-server/ /build
ADD lib/ /lib/

RUN mkdir /build/yarn_links

WORKDIR /build
ENV YARN_LINK_ARGS='--link-folder /build/yarn_links'
ENV NODE_ENV=production
RUN yarn install --frozen-lockfile --link-duplicates
RUN yarn build


FROM node:18-alpine
RUN apk add postgresql-client bash

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs -g nodejs

ADD --chown=nodejs:nodejs config /config
COPY --chown=nodejs:nodejs --from=build /lib /lib
COPY --chown=nodejs:nodejs --from=build /build /build

USER nodejs
WORKDIR /build
ENTRYPOINT yarn start:prod
