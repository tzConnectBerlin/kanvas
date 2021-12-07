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
       ipfs_hash TEXT,
       nft_contract TEXT,
       token_id TEXT
);

-- updated_at procedure

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   IF row(NEW.*) IS DISTINCT FROM row(OLD.*) THEN
      NEW.updated_at = now(); 
      RETURN NEW;
   ELSE
      RETURN OLD;
   END IF;
END;
$$ language 'plpgsql';

-- set trigger
CREATE TRIGGER update_nft_updated_at BEFORE UPDATE ON nft FOR EACH ROW EXECUTE PROCEDURE  update_updated_at_column();

COMMIT;

-- ==== DOWN ====

BEGIN;
DROP TABLE nft;
COMMIT;
