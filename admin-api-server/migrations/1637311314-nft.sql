-- Migration: nft
-- Created at: 2021-11-19 09:41:54
-- ====  UP  ====

BEGIN;
-- NFT table
CREATE TABLE nft (
      id SERIAL PRIMARY KEY,
      nft_state TEXT NOT NULL,
      nft_name TEXT NOT NULL,
      metadata JSONB NOT NULL,	--can be empty though, but not NULL
      data_uri TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      disabled boolean DEFAULT false,
      created_by INT REFERENCES kanvas_user(id),

      price NUMERIC,
      editions_size INTEGER,
      categories INTEGER[],
      proposed BOOLEAN
);

COMMIT;

-- ==== DOWN ====

BEGIN;
DROP TABLE nft;
COMMIT;
