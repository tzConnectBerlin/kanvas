## Description

The admin app for creating, approving, and publishing NFTs to be purchased in the whitelabel store.

The user facing side is in a different project, using a separate database.

## Installation

```bash
$ yarn
```

### Start development database

You can run postgres on `localhost`, a server, or in a Docker container by running `./script/local-db` listening to port 5433.

### Migrations

Replace the username/password and db name with values that match your setup
`$ ./script/migrate up` or `docker-compose up`

### Seeding

`yarn seed`
### Docker build

`docker-compose build`

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

Before running tests, you must run a database `$ ./script/local-db` and then migrate with `$ sh ./script/migrate.sh`. Then you must populate the database with test data by running `$ psql < script/populate-testdb.sql`. TODO improve this workflow.

```bash
# unit tests
$ yarn test

# e2e tests
$ yarn test:e2e

# test coverage
$ yarn test:cov
```
