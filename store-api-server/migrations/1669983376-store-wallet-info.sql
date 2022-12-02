-- Migration: store-wallet-info
-- Created at: 2022-12-02 13:16:16
-- ====  UP  ====

BEGIN;

ALTER TABLE marketing ADD COLUMN sso_id TEXT;
ALTER TABLE marketing ADD COLUMN sso_type TEXT;
ALTER TABLE marketing ADD COLUMN sso_email TEXT;

ALTER TABLE marketing ADD COLUMN wallet_provider TEXT;
UPDATE marketing
SET wallet_provider = 'unknown; pre-migration';
ALTER TABLE marketing ALTER COLUMN wallet_provider SET NOT NULL;

COMMIT;

-- ==== DOWN ====

BEGIN;

ALTER TABLE marketing DROP COLUMN wallet_provider;
ALTER TABLE marketing DROP COLUMN sso_id;
ALTER TABLE marketing DROP COLUMN sso_type;
ALTER TABLE marketing DROP COLUMN sso_email;

COMMIT;
