FROM node
ADD . .
ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_OPTIONS --openssl-legacy-provider
RUN yarn
RUN yarn start
