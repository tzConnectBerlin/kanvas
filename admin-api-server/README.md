## Description

The admin app for creating, approving, and publishing NFTs to be purchased in the whitelabel store.

## Installation

See, then run the git root `deploy-scripts/install/admin-api.bash` script.

### Start development database

You can run postgres on `localhost`, a server, or in a Docker container by running `./script/local-db` listening to port 5433.

### Migrations

with relavent PG.. env vars set (see env.example):
`$ ./script/migrate up` or `docker-compose up`

To create a new migration, run `./script/shmig -t postgresql -d postgresql create my_table_name`

### Seeding

`yarn seed`

## Running the app

```bash
# development
$ yarn start

# watch mode
$ yarn start:dev

# production mode
$ yarn start:prod
```

## Generate JWT Secret / Public Key

```bash
# generate secret
ssh-keygen -t rsa -b 4096 -m PEM -f jwtRS256.key 
# generate public key for secret
openssl rsa -in jwtRS256.key -pubout -outform PEM -out jwtRS256.key.pub
```

## Test

```bash
$ yarn test
```
