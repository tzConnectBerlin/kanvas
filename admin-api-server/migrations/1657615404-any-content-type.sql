-- Migration: any-content-type
-- Created at: 2022-07-12 10:43:24
-- ====  UP  ====

BEGIN;

UPDATE nft_attribute
SET name = 'artifact'
WHERE name = 'image';

COMMIT;

-- ==== DOWN ====

BEGIN;

UPDATE nft_attribute
SET name = 'image'
WHERE name = 'artifact';

COMMIT;
