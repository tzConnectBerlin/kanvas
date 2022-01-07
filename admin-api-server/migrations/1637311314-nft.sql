-- Migration: nft
-- Created at: 2021-11-19 09:41:54
-- ====  UP  ====

BEGIN;
-- NFT table
CREATE TABLE nft (
  id SERIAL PRIMARY KEY,
  state TEXT NOT NULL,
  created_by INT REFERENCES kanvas_user(id),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC'),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC')
);

CREATE TABLE nft_attribute (
  nft_id INTEGER NOT NULL REFERENCES nft(id),
  name TEXT NOT NULL,
  value TEXT
);

COMMIT;

-- ==== DOWN ====

BEGIN;
DROP TABLE nft;
DROP TABLE nft_attribute;
COMMIT;
