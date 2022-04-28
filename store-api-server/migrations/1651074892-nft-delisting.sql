-- Migration: nft-delisting
-- Created at: 2022-04-27 17:54:52
-- ====  UP  ====

BEGIN;

ADD TABLE nft_delisted (LIKE nft);

COMMIT;

-- ==== DOWN ====

BEGIN;

DROP TABLE nft_delisted;

COMMIT;
