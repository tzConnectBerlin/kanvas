-- Migration: nft
-- Created at: 2021-11-05 14:23:00
-- ====  UP  ====

BEGIN;
CREATE TABLE nft (
       nft_id SERIAL PRIMARY KEY,
       nft_name TEXT NOT NULL,
       ipfsHash TEXT NOT NULL,
       metadata JSONB NOT NULL,	--can be empty though, but not NULL
       dataUri TEXT,
       contract TEXT,
       tokenId TEXT
);
COMMIT;

-- ==== DOWN ====

BEGIN;
DROP TABLE nft;
COMMIT;
