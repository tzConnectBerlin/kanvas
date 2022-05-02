"use strict";
exports.__esModule = true;
exports.NUM_TOP_BUYERS = exports.CACHE_SIZE = exports.CACHE_TTL = exports.RATE_LIMIT = exports.RATE_LIMIT_TTL = exports.STORE_PUBLISHERS = exports.ADMIN_PUBLIC_KEY = exports.MINTER_ADDRESS = exports.SEARCH_SIMILARITY_LIMIT = exports.SEARCH_MAX_CATEGORIES = exports.SEARCH_MAX_NFTS = exports.PROFILE_PICTURE_MAX_BYTES = exports.PG_UNIQUE_VIOLATION_ERRCODE = exports.PG_FOREIGN_KEY_VIOLATION_ERRCODE = exports.PG_CONNECTION = void 0;
var utils_1 = require("./utils");
exports.PG_CONNECTION = 'PG_CONNECTION';
// source: https://www.postgresql.org/docs/current/errcodes-appendix.html
exports.PG_FOREIGN_KEY_VIOLATION_ERRCODE = '23503';
exports.PG_UNIQUE_VIOLATION_ERRCODE = '23505';
exports.PROFILE_PICTURE_MAX_BYTES = 1000 * 1000 * 2; // 2MB
exports.SEARCH_MAX_NFTS = 3;
exports.SEARCH_MAX_CATEGORIES = 6;
exports.SEARCH_SIMILARITY_LIMIT = 0.4;
exports.MINTER_ADDRESS = (0, utils_1.assertEnv)('MINTER_TZ_ADDRESS');
exports.ADMIN_PUBLIC_KEY = (0, utils_1.assertEnv)('ADMIN_PUBLIC_KEY'); // this probably should be the revealed public key associated to the MINTER_ADDRESS (MINTER_ADDRESS is the public key hash)
exports.STORE_PUBLISHERS = ['Tezos'];
exports.RATE_LIMIT_TTL = Number(process.env['RATE_LIMIT_TTL'] || 60); // in seconds
exports.RATE_LIMIT = Number(process.env['RATE_LIMIT'] || 100);
exports.CACHE_TTL = Number(process.env['CACHE_TTL'] || 60); // in seconds
exports.CACHE_SIZE = Number(process.env['CACHE_SIZE'] || 10000); // in max number of items in the cache
exports.NUM_TOP_BUYERS = 12;
