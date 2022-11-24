-- Migration: payment-store-purchaser-country
-- Created at: 2022-11-24 18:15:24
-- ====  UP  ====

BEGIN;

ALTER TABLE payment ADD COLUMN purchaser_country TEXT;

COMMIT;

-- ==== DOWN ====

BEGIN;

ALTER TABLE payment DROP COLUMN purchaser_country;

COMMIT;
