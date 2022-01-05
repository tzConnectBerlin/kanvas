-- Migration: session_cart_v2
-- Created at: 2021-12-21 10:54:19
-- ====  UP  ====

BEGIN;



CREATE TABLE nft_order (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES kanvas_user(id),
    order_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

CREATE TABLE mtm_nft_order_nft (
    nft_order_id INT NOT NULL REFERENCES nft_order(id),
    nft_id INT NOT NULL REFERENCES nft(id)
);

CREATE TYPE payment_status AS ENUM ('created', 'processing', 'canceled', 'succeeded', 'failed' );
CREATE TYPE payment_provider AS ENUM ('stripe', 'tezos' );

CREATE TABLE payment (
    id SERIAL PRIMARY KEY,
    payment_id TEXT NOT NULL,
    status payment_status NOT NULL,
    nft_order_id INT NOT NULL REFERENCES nft_order(id),
    provider payment_provider NOT NULL
);

ALTER TABLE cart_session ADD COLUMN order_id INT REFERENCES nft_order(id);

COMMIT;

-- ==== DOWN ====

BEGIN;

DROP TABLE order;
DROP TABLE mtm_order_nft;

DROP TYPE payment_status;
DROP TYPE payment_provider;

DROP TABLE payment;

ALTER TABLE cart_session DROP COLUMN order_id;

COMMIT;
