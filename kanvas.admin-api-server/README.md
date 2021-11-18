## Description

The admin app for creating, approving, and publishing NFTs to be purchased in the whitelabel store.

The user facing side is in a different project, using a separate database.

## Installation

```bash
$ yarn
```

### Migrations

Replace the username/password and db name with values that match your setup
`$ ./script/shmig -t postgresql -d postgres://dev_user:dev_password@localhost/dev_database up`

To create a new migration, run `./script/shmig -t postgresql -d postgres://dev_user:dev_password@localhost/dev_database create my_table_name`

## Running the app

```bash
# development
$ yarn start

# watch mode
$ yarn start:dev

# production mode
$ yarn start:prod
```

## Test

```bash
# unit tests
$ yarn test

# e2e tests
$ yarn test:e2e

# test coverage
$ yarn test:cov
```
