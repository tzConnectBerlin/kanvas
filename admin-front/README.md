## Kanvas Admin System

### About

react-admin is an opinionated admin system with the ability to hook into various auth providers and using styled components built on mui.

authorization happens via the authProvider, which is a specifically typed object

pages are customizable and use fields and inputs, depending on view/input

we will be receiving actions based on roles to determine who can interact with which phase of the admin system

categories will be defined initially (and are non-extensible) from the config

roles will be hard coded (in a config) from the beginning and non extensible (ex: super-user, user, creator, editor)

### Setup

To use please setup and run the admin-api-server first (read the README).

### warning: Remember to launch the postgres db, run migrations and seed, then use those credentials for your super-user.

then

0. dont forget to setup your .env file to connect to your admin-api-server listening port/url
1. yarn
2. yarn start

You should be able to login with your super-user credential and use the system.

### Note: Some abilities (especially related to NFTs) are not available to the super-user

Users are created by the super-user, or other users with those abilities.

Some content will be locked behind certain roles or abilities.

### extras
a kukai/beacon sign-in page and a wallet context provider are still in the repo, and may be useful for integrating into the blockchain for the minting process later. 