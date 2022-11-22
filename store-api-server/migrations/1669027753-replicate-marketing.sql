-- Migration: replicate-marketing
-- Created at: 2022-11-21 11:49:13
-- ====  UP  ====

BEGIN;

ALTER PUBLICATION store_pub ADD TABLE marketing;

COMMIT;

-- ==== DOWN ====

BEGIN;

ALTER PUBLICATION store_pub DROP TABLE marketing;

COMMIT;
