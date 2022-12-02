# note: expected build context is the git root directory
FROM node:18-alpine AS build
RUN apk add bash

WORKDIR /build
ENV YARN_LINK_ARGS='--link-folder /build/yarn_links'

ADD admin-api-server/ .
ADD lib/ /lib/

RUN mkdir yarn_links
RUN yarn install --frozen-lockfile --link-duplicates
RUN yarn build

# To use only usefull files
RUN mkdir result &&\
    mv package.json result/ &&\
    mv config result/ &&\
    mv dist result/ &&\
    mv migrations result/ &&\
    mv node_modules result/ &&\
    mv script result/ &&\
    mv stm-lib result/ &&\
    mv yarn_links result/

FROM node:18-alpine
RUN apk add postgresql-client bash

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs -g nodejs

USER nodejs
WORKDIR /build

COPY --chown=nodejs:nodejs --from=build /build/result/ .
COPY --chown=nodejs:nodejs --from=build /lib /lib

ENTRYPOINT script/entrypoint
