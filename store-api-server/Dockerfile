FROM node
WORKDIR /build
ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_OPTIONS --openssl-legacy-provider
ENV TZ=UTC
RUN apt-get update && apt-get upgrade -y
ADD . .
RUN yarn
ENTRYPOINT yarn start
