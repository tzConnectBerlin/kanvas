## Description

Back end for the white label store for selling NFTs.

Built with [Nest](https://github.com/nestjs/nest) framework.

Please note that you must use Yarn, not NPM to install dependencies.

Usage of the API is documented here: https://tzconnectberlin.github.io/slate

## Installation

```bash
$ yarn install
```

For development, you also need to add file `.env`, with the following contents:

```
DB_PORT=5432
DB_USERNAME=dev_user
DB_PASSWORD=dev_password
DB_DATABASE=dev_database
DB_HOST=localhost

JWT_EXPIRATION_TIME=86400000
JWT_SECRET='wPK-TfcjDSjztKrb4SUnfRPQ1YIovrooYQaX4h-EnU4'
```

With Docker you can also run a development version of the database with `./script/local-db.bash`.

## Running the app

### Migrations

Replace the username/password and db name with values that match your setup
`$ ./script/shmig -t postgresql -d postgres://dev_user:dev_password@localhost/dev_database up`

To create a new migration, run `./script/shmig -t postgresql -d postgres://dev_user:dev_password@localhost/dev_database create my_table_name`

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

It should now be available at `http://localhost:3000/`.


#### Note

Currently as part of the migrations files, Database stored procedures are
defined too. This means that part of the functionality of queries is defined
in `migrations/...`.

For example, if you see something like `SELECT ... FROM some_custom_function(..)`
somewhere in the typescript code, `some_custom_function` is defined in the migrations folder.

## Test

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## License

Copyright All rights reserved TZ Connect, Berlin Germany
