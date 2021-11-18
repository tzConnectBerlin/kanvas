FROM node
ADD . .
ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_OPTIONS --openssl-legacy-provider
RUN yarn --network-timeout 100000
ENTRYPOINT yarn start
