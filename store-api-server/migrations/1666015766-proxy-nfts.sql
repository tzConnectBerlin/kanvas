-- Migration: proxy-nfts
-- Created at: 2022-10-17 16:09:26
-- ====  UP  ====

BEGIN;

ALTER TABLE nft ADD COLUMN proxy_nft_id INT REFERENCES nft(id);
CREATE INDEX ON nft(proxy_nft_id);

CREATE TABLE proxy_unfold (
  id SERIAL PRIMARY KEY,

  proxy_nft_id INT NOT NULL REFERENCES nft(id) UNIQUE,

  unfold_nft_id INT NOT NULL REFERENCES nft(id),
  claimed BOOLEAN NOT NULL DEFAULT false,

  UNIQUE (proxy_nft_id, id)
);

ALTER TABLE __nft_delisted ADD COLUMN proxy_nft_id INT REFERENCES nft(id);

COMMIT;

-- ==== DOWN ====

BEGIN;

ALTER TABLE nft DROP COLUMN proxy_nft_id;
DROP TABLE proxy_unfold;
ALTER TABLE __nft_delisted DROP COLUMN proxy_nft_id;

COMMIT;
