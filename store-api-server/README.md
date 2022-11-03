## Description

The backend for the white label store for selling NFTs.

Built with [Nest](https://github.com/nestjs/nest) framework.

Please note that we use Yarn, not NPM, to install dependencies.

Usage of the API is documented here: https://tzconnectberlin.github.io/slate (though somewhat outdated).

## Installation

```bash
$ yarn install
```

For development, you also need to add file `.env`, see `env.example` for variables that are required to set.

With Docker you can also run a development version of the database with `./script/local-db`.

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

## Test

```bash
# unit tests
$ yarn run test
```

## License

Copyright All rights reserved TZ Connect, Berlin Germany
