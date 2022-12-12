-- Migration: replicate-peppermint
-- Created at: 2022-12-12 13:49:18
-- ====  UP  ====

BEGIN;

ALTER PUBLICATION store_pub ADD TABLE peppermint.operations;

COMMIT;

-- ==== DOWN ====

BEGIN;

ALTER PUBLICATION store_pub DROP TABLE peppermint.operations;

COMMIT;
