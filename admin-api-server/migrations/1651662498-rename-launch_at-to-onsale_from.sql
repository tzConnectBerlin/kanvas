-- Migration: rename-launch_at-to-onsale_from
-- Created at: 2022-05-04 13:08:18
-- ====  UP  ====

BEGIN;

UPDATE nft_attribute
SET name = 'onsale_from'
WHERE name = 'launch_at';

COMMIT;

-- ==== DOWN ====

BEGIN;

UPDATE nft_attribute
SET name = 'launch_at'
WHERE name = 'onsale_from';

COMMIT;
