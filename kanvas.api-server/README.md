## Description

Back end for the white label store for selling NFTs.

Built with [Nest](https://github.com/nestjs/nest) framework.

Please note that you must use Yarn, not NPM to install dependencies.

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

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## License
Copyright All rights reserved TZ Connect, Berlin Germany
