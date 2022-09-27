-- Migration: assets-ipfs-hash
-- Created at: 2022-06-16 16:24:14
-- ====  UP  ====

BEGIN;

ALTER TABLE nft RENAME COLUMN ipfs_hash TO metadata_ipfs;
ALTER TABLE nft ADD COLUMN artifact_ipfs TEXT;
ALTER TABLE nft ADD COLUMN display_ipfs TEXT;
ALTER TABLE nft ADD COLUMN thumbnail_ipfs TEXT;

ALTER TABLE __nft_delisted RENAME COLUMN ipfs_hash TO metadata_ipfs;
ALTER TABLE __nft_delisted ADD COLUMN artifact_ipfs TEXT;
ALTER TABLE __nft_delisted ADD COLUMN display_ipfs TEXT;
ALTER TABLE __nft_delisted ADD COLUMN thumbnail_ipfs TEXT;

COMMIT;

-- ==== DOWN ====

BEGIN;

ALTER TABLE nft RENAME COLUMN metadata_ipfs TO ipfs_hash;
ALTER TABLE nft DROP COLUMN artifact_ipfs;
ALTER TABLE nft DROP COLUMN display_ipfs;
ALTER TABLE nft DROP COLUMN thumbnail_ipfs;

ALTER TABLE __nft_delisted RENAME COLUMN metadata_ipfs TO ipfs_hash;
ALTER TABLE __nft_delisted DROP COLUMN artifact_ipfs;
ALTER TABLE __nft_delisted DROP COLUMN display_ipfs;
ALTER TABLE __nft_delisted DROP COLUMN thumbnail_ipfs;

COMMIT;
