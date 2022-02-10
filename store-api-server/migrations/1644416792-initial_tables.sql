-- Migration: initial_tables
-- Created at: 2022-02-09 15:26:32
-- ====  UP  ====

BEGIN;

CREATE TYPE payment_status AS ENUM ('created', 'processing', 'canceled', 'succeeded', 'failed', 'timedOut' );
CREATE TYPE payment_provider AS ENUM ('stripe', 'tezos', 'test_provider');

CREATE TABLE nft_order (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    order_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

CREATE TABLE payment (
    id SERIAL PRIMARY KEY,
    payment_id TEXT NOT NULL,
    status payment_status NOT NULL,
    nft_order_id INT NOT NULL REFERENCES nft_order(id),
    provider payment_provider NOT NULL,
    expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

CREATE TABLE cart_session(
  id SERIAL PRIMARY KEY,
  session_id UUID NOT NULL UNIQUE,
  expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  order_id INT REFERENCES nft_order(id)
);
CREATE INDEX ON cart_session(expires_at);

-- mtm = many to many
CREATE TABLE kanvas_user (
  id SERIAL PRIMARY KEY,
  user_name TEXT UNIQUE NOT NULL,
  address TEXT UNIQUE NOT NULL,
  signed_payload TEXT,
  cart_session UUID REFERENCES cart_session(session_id) ON DELETE SET NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC'),
  picture_url TEXT
);


CREATE TABLE nft (
  id SERIAL PRIMARY KEY,

  nft_name TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC'),
  launch_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC'),

  artifact_uri TEXT NOT NULL,
  display_uri TEXT,
  thumbnail_uri TEXT,

  ipfs_hash TEXT,
  price NUMERIC NOT NULL,
  editions_size INT NOT NULL,

  view_count INT NOT NULL DEFAULT 0
);
CREATE INDEX ON nft(view_count);

CREATE TABLE nft_category (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  parent INT REFERENCES nft_category(id)
);


CREATE TABLE mtm_kanvas_user_nft (
  id BIGSERIAL PRIMARY KEY,
  kanvas_user_id INT REFERENCES kanvas_user(id),
  nft_id INT REFERENCES nft(id)
);
CREATE INDEX ON mtm_kanvas_user_nft(kanvas_user_id);
CREATE INDEX ON mtm_kanvas_user_nft(nft_id);

CREATE TABLE mtm_nft_category (
  id SERIAL PRIMARY KEY,
  nft_category_id INT REFERENCES nft_category(id),
  nft_id INT REFERENCES nft(id)
);
CREATE INDEX ON mtm_nft_category(nft_category_id);
CREATE INDEX ON mtm_nft_category(nft_id);

CREATE TABLE mtm_cart_session_nft(
  cart_session_id INT NOT NULL REFERENCES cart_session(id) ON DELETE CASCADE,
  nft_id INT NOT NULL REFERENCES nft(id),

  PRIMARY KEY(cart_session_id, nft_id)
);

CREATE TABLE mtm_nft_order_nft (
  id BIGSERIAL PRIMARY KEY,
  nft_order_id INT NOT NULL REFERENCES nft_order(id),
  nft_id INT NOT NULL REFERENCES nft(id)
);
CREATE INDEX ON mtm_nft_order_nft(nft_order_id);
CREATE INDEX ON mtm_nft_order_nft(nft_id);

ALTER TABLE nft_order ADD CONSTRAINT nft_order_user_id_fkey FOREIGN KEY (user_id) REFERENCES kanvas_user(id);

COMMIT;

-- ==== DOWN ====

BEGIN;

DROP TABLE mtm_nft_category;
DROP TABLE mtm_kanvas_user_nft;
DROP TABLE mtm_cart_session_nft;
DROP TABLE mtm_nft_order_nft;

DROP TABLE kanvas_user;
DROP TABLE nft;
DROP TABLE nft_category;
DROP TABLE cart_session;
DROP TABLE nft_order;

COMMIT;
