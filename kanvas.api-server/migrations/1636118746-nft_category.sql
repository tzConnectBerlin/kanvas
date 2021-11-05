-- Migration: nft_category
-- Created at: 2021-11-05 14:25:46
-- ====  UP  ====

BEGIN;
CREATE TABLE nft_category (
       nft_category_id SERIAL PRIMARY KEY,
       nft_category_name TEXT NOT NULL,
       description TEXT NOT NULL,
       parent INT,
       CONSTRAINT fk_nft FOREIGN KEY(parent) REFERENCES nft(nft_id)
);
CREATE TABLE mtm_nft_category (
       nft_category_id INT REFERENCES nft_category(nft_category_id) ON UPDATE CASCADE ON DELETE CASCADE,
       nft_id INT REFERENCES nft(nft_id) ON UPDATE CASCADE ON DELETE CASCADE
);
COMMIT;

-- ==== DOWN ====

BEGIN;
DROP TABLE nft_category;
DROP TABLE mtm_nft_category;
COMMIT;
