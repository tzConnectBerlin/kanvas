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
The most straightforward way of running locally is with Docker. We've prepared a docker-compose.yml so that all that's
needed is to run `docker-compose up`, `docker-compose down` and `docker-compose build`. 

Note however that this docker-compose.yml only runs the backend components (2
postgres databases, the Store API, and the Admin API), so it'd still be
required to run the Front components natively.

Now the ports are as follows:

* Store PG `54320`
* Store API `3005`
* Admin API `3006`
* Admin PG `54321`

### Natively without docker

Alternatively, there's also scripts in each components' `script/` directory that can be called, or/and scripts in the
git root `deploy-scripts/` directory. This allows to run on your native machine, rather than through Docker. But it also
requires some effort in glueing the different components together through correctly defined ENV variables.


# API Docs

There's currently only some documentation ready for the Store API:

- https://tzconnectberlin.github.io/slate/#introduction

It is outdated (missing a few newer endpoints) and may contain some errors. To be updated soon.


# How we interact with the Tezos blockchain (read and write operations)

We use [Peppermint](https://github.com/tzConnectBerlin/peppermint) for minting NFTs (in other words, our write actions), and [Que Pasa](https://github.com/tzConnectBerlin/que-pasa) for reading what has actually happened onchain (to verify whether minting was succesfull, but also to pickup on NFT ownership transfers).

This section is to be further explained soon (eg, need to document how to setup and start these tools, and characterize what kind of highlevel approach this gives us).
