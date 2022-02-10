FROM node
WORKDIR /build
ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_OPTIONS --openssl-legacy-provider
ENV TZ=UTC

# need psql
RUN apt update && apt upgrade -y
RUN apt install -y postgresql

ADD . .
ADD .env .
RUN yarn install

ENTRYPOINT yarn start
