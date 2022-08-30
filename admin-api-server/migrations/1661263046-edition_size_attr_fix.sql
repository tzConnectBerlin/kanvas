-- Migration: edition_size_attr_fix
-- Created at: 2022-08-23 14:57:26
-- ====  UP  ====

BEGIN;

UPDATE nft_attribute
SET name = 'edition_size'
WHERE name = 'editions_size';

COMMIT;

-- ==== DOWN ====

BEGIN;

UPDATE nft_attribute
SET name = 'editions_size'
WHERE name = 'edition_size';

COMMIT;
