-- Migration: nft
-- Created at: 2021-11-05 14:23:00
-- ====  UP  ====

BEGIN;
CREATE TABLE nft (
       id SERIAL PRIMARY KEY,
       nft_name TEXT NOT NULL,
       ipfs_hash TEXT NOT NULL,
       metadata JSONB NOT NULL,	--can be empty though, but not NULL
       data_uri TEXT,
       contract TEXT,
       token_id TEXT
);
COMMIT;

-- ==== DOWN ====

BEGIN;
DROP TABLE nft;
COMMIT;
