-- Migration: remove-png-from-attr-names
-- Created at: 2022-05-25 11:56:23
-- ====  UP  ====

BEGIN;

UPDATE nft_attribute
SET name = 'image'
WHERE name = 'image.png';

UPDATE nft_attribute
SET name = 'thumbnail'
WHERE name = 'thumbnail.png';

COMMIT;

-- ==== DOWN ====

BEGIN;

UPDATE nft_attribute
SET name = 'image.png'
WHERE name = 'image';

UPDATE nft_attribute
SET name = 'thumbnail.png'
WHERE name = 'thumbnail';

COMMIT;
