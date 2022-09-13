# Kanvas Whitelabel NFT Store

A Kanvas demo is hosted under https://kanvas-demo.tzconnect.berlin. Accompanying administration website (through which NFTs are created) is hosted under https://admin.kanvas-demo.tzconnect.berlin.

In the admin website, you may login as an `editor` with following credentials:
- username: editor@kanvas.berlin
- password: editor

With this editor role, you are allowed to propose NFTs (you can create NFTs, and edit their various attributes until it gets to a state where a `moderator` must approve it. You may also edit anyone elses' created NFT when the NFT is in the setup state.

On the store, you may login with your own Tezos wallet or with Kukai (social login). Feel free to "purchase" NFTs, currently only Stripe is supported for payments. In this demo deployment Stripe is in a test mode, where you don't have to provide a real creditcard, and payments go through without any actual money involved. Use this test creditcard: `4242 4242 4242 4242`, with any expiration set in the future, and any CVC. Or if selecting the Debit option, use IBAN number `DE89370400440532013000`, with any valid looking data for the remaining fields.

## Official Kanvas Docs and Guide

You can check out our docs at [tz-connect.notion.site](https://tz-connect.notion.site/The-Tezos-Whitelabel-NFT-Store-55fbedb8f776402888b55dc756660c05) for further information about:

- infrastructure
- guides & processes to install
- workflow
- different roles
- extras like FAQ

## API Docs

There's currently only documentation ready for the Store API:

- https://tzconnectberlin.github.io/slate/#introduction
