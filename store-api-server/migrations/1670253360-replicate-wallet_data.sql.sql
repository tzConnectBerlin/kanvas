-- Migration: replicate-wallet_data.sql
-- Created at: 2022-12-05 16:16:00
-- ====  UP  ====

BEGIN;

ALTER PUBLICATION store_pub ADD TABLE wallet_data;

COMMIT;

-- ==== DOWN ====

BEGIN;

ALTER PUBLICATION store_pub DROP TABLE wallet_data;

COMMIT;
