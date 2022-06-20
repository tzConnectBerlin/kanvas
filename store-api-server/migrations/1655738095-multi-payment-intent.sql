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

ALTER TABLE nft_order ALTER COLUMN expires_at SET NOT NULL;


ALTER TABLE payment DROP COLUMN expires_at;

ALTER TABLE payment DROP CONSTRAINT payment_nft_order_id_uniq;
CREATE INDEX payment_nft_order_id_idx ON payment(nft_order_id);

ALTER TYPE payment_provider ADD VALUE 'wert';


COMMIT;

-- ==== DOWN ====

BEGIN;

COMMIT;
