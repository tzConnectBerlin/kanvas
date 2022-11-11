-- Migration: onsale-until
-- Created at: 2022-05-04 14:16:15
-- ====  UP  ====

BEGIN;

ALTER TABLE nft RENAME COLUMN launch_at TO onsale_from;
ALTER TABLE nft ADD COLUMN onsale_until TIMESTAMP WITHOUT TIME ZONE;

ALTER TABLE __nft_delisted RENAME COLUMN launch_at TO onsale_from;
ALTER TABLE __nft_delisted ADD COLUMN onsale_until TIMESTAMP WITHOUT TIME ZONE;

COMMIT;

-- ==== DOWN ====

BEGIN;

ALTER TABLE nft RENAME COLUMN onsale_from TO launch_at;
ALTER TABLE nft DROP COLUMN onsale_until;

ALTER TABLE __nft_delisted RENAME COLUMN onsale_from TO launch_at;
ALTER TABLE __nft_delisted DROP COLUMN onsale_until;

COMMIT;
