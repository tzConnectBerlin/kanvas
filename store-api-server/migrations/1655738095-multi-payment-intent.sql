-- Migration: multi-payment-intent
-- Created at: 2022-06-20 17:14:55
-- ====  UP  ====

BEGIN;


ALTER TABLE payment ADD COLUMN currency TEXT;

UPDATE payment SET currency = 'unknown';

UPDATE payment
SET currency = nft_order.currency
FROM nft_order
WHERE payment.nft_order_id = nft_order.id;

ALTER TABLE payment ALTER COLUMN currency SET NOT NULL;

ALTER TABLE payment ADD COLUMN amount NUMERIC;
UPDATE PAYMENT set amount = 0;
ALTER TABLE payment ALTER COLUMN amount SET NOT NULL;


ALTER TABLE mtm_nft_order_nft DROP COLUMN price;
ALTER TABLE __mtm_nft_order_nft_delisted DROP COLUMN price;


ALTER TABLE nft_order DROP COLUMN currency;
ALTER TABLE nft_order ADD COLUMN expires_at TIMESTAMP WITHOUT TIME ZONE;

UPDATE nft_order
SET expires_at = payment.expires_at
FROM payment
WHERE payment.nft_order_id = nft_order.id;

UPDATE nft_order
SET expires_at = 'epoch'
WHERE expires_at IS NULL;

ALTER TABLE nft_order ALTER COLUMN expires_at SET NOT NULL;


ALTER TABLE payment DROP COLUMN expires_at;

ALTER TABLE payment DROP CONSTRAINT payment_nft_order_id_uniq;
CREATE INDEX payment_nft_order_id_idx ON payment(nft_order_id);

ALTER TYPE payment_provider ADD VALUE IF NOT EXISTS 'wert';


COMMIT;

-- ==== DOWN ====

BEGIN;

ALTER TABLE nft_order ADD COLUMN currency TEXT;

UPDATE nft_order SET currency = 'unknown';

UPDATE nft_order
SET currency = payment.currency
FROM payment
WHERE payment.nft_order_id = nft_order.id;

ALTER TABLE nft_order ALTER COLUMN currency SET NOT NULL;

ALTER TABLE payment DROP COLUMN amount;

ALTER TABLE mtm_nft_order_nft ADD COLUMN price NUMERIC;
ALTER TABLE __mtm_nft_order_nft_delisted ADD COLUMN price NUMERIC;

ALTER TABLE payment DROP COLUMN currency;
ALTER TABLE payment ADD COLUMN expires_at TIMESTAMP WITHOUT TIME ZONE;

UPDATE payment
SET expires_at = nft_order.expires_at
FROM nft_order
WHERE payment.nft_order_id = nft_order.id;

ALTER TABLE payment ALTER COLUMN expires_at SET NOT NULL;

ALTER TABLE nft_order DROP COLUMN expires_at;

DROP INDEX payment_nft_order_id_idx;
ALTER TABLE payment ADD CONSTRAINT payment_nft_order_id_uniq UNIQUE (nft_order_id);

COMMIT;
