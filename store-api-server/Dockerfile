FROM node
WORKDIR /build
ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_OPTIONS --openssl-legacy-provider
ENV TZ=UTC

# need psql
RUN apt update && apt upgrade -y
RUN apt install -y postgresql

# Need docker inside, so we can run migrate.bash
# (which itself does a docker run to perform que-pasa migrations)
RUN apt install -y ca-certificates \
    curl \
    gnupg \
    lsb-release
RUN apt-get -y install apt-transport-https ca-certificates curl gnupg2 software-properties-common
RUN curl -fsSL https://download.docker.com/linux/debian/gpg | apt-key add -
RUN add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/debian $(lsb_release -cs) stable"
RUN apt-get update
RUN apt-get -y install docker-ce

ADD . .
RUN yarn install

ENTRYPOINT yarn start
