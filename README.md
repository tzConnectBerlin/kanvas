# Kanvas Whitelabel NFT Store

## Infrastructure

Kanvas exists of 6 components:
- Store Postgresql database (we'll refer to this with Store PG)
- Store API
- Store Front
- Admin Postgresql database (we'll refer to this with Admin PG)
- Admin API
- Admin Front

The Store components together provide the NFT store where your platform's users can browse, purchase, collect your NFTs.

The Admin components together provide a role-based moderated NFT creation system, plus some store analytics. Ultimately,
created NFTs from Admin arrive in the Store's `nft` table. One can therefore easily replace Admin with something else
that determines the `nft` table entries.

Both APIs target their own Postgresql database (that may or may not be on the same Postgresql server). The Store PG is
replicated into the Admin PGs server under `store_replication` database name, for two reasons:
- It allows us to perform sales analytics queries in the Admin API that may induce some load on Postgresql, without affecting the Store performance (assuming we're running the 2 database components on a separate server).
- It gives us some backup functionality of the Store PG.

## Running in development

### With docker and docker-compose
The most straightforward way of running locally is with Docker. We've prepared a docker-compose.yml.

#### Prerequisites

`docker-compose` -- the version installed by ubuntu 20 using apt does not work, get the most recent from https://docs.docker.com/compose/install/

`yarn` and `npm`: get npm from https://docs.npmjs.com/downloading-and-installing-node-js-and-npm and install yarn using `npm install -g yarn`.

You will need to have the following set up prior to installation
- an S3 account, its access key and secret
- a Pinata account, its API key and secret
- a Stripe account, its secret and webhook secret
- a minter address on whatever testnet you are using

Put these together into the file `kanvas/store-api-server/.env` which will look like this:

```
AWS_S3_BUCKET='bucketname'
AWS_S3_ACCESS_KEY=''
AWS_S3_KEY_SECRET=''

PINATA_API_KEY=''
PINATA_API_SECRET=''

STRIPE_SECRET=''
STRIPE_WEBHOOK_SECRET=''

CART_EXPIRATION_MILLI_SECS=1800000
ORDER_EXPIRATION_MILLI_SECS=3600000

PGPORT=5432
PGHOST=localhost
PGUSER=postgres
PGPASSWORD=''
PGDATABASE='test_db'

JWT_EXPIRATION_TIME=86400000
JWT_SECRET=''

KANVAS_API_PORT=3000

MINTER_TZ_ADDRESS='tz1..'
```

Now all that's needed is to run `docker-compose up` in order to run the back-end components.

The front-end components run outside of docker, because they are trivial to run, and this makes development of the user interface much easier.

```
yarn global add serve
exp
```

To run the front-end components you will once more need `.env` files:

in `store-front/.env`:

```
REACT_APP_API_SERVER_BASE_URL=http://localhost:3005
REACT_APP_STRIPE_PK_KEY=pk_test_...
REACT_APP_CLIENT_URL=http://localhost:3001
REACT_APP_PORT=3001
```

and in `admin-front/.env`:
```
REACT_APP_API_SERVER_BASE_URL=http://localhost:3006
REACT_APP_API_SERVER_BASE_URL_PREFIX=localhost:3006
REACT_APP_STORE_BASE_URL="http://localhost:3005/
REACT_APP_PORT=3001
```

The default ports are as follows:
* Store PG `54320`
* Store API `3005`
* Admin API `3006`
* Admin PG `54321`

### Natively without docker

Alternatively, there's also scripts in each components' `script/` directory that can be called, or/and scripts in the git root `deploy-scripts/` directory. This allows to run on your native machine, rather than through Docker. But it also requires some effort in glueing the different components together through correctly defined ENV variables.


# API Docs

There's currently only some documentation ready for the Store API:

- https://tzconnectberlin.github.io/slate/#introduction

It is outdated (missing a few newer endpoints) and may contain some errors. To be updated soon.


# How we interact with the Tezos blockchain (read and write operations)

We use [Peppermint](https://github.com/tzConnectBerlin/peppermint) for minting NFTs (in other words, our write actions), and [Que Pasa](https://github.com/tzConnectBerlin/que-pasa) for reading what has actually happened onchain (to verify whether minting was succesfull, but also to pickup on NFT ownership transfers).

This section is to be further explained soon (eg, need to document how to setup and start these tools, and characterize what kind of highlevel approach this gives us).
