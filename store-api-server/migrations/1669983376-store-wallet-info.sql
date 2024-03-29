-- Migration: store-wallet-info
-- Created at: 2022-12-02 13:16:16
-- ====  UP  ====

BEGIN;

CREATE TABLE wallet_data (
  id SERIAL NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),

  address TEXT NOT NULL REFERENCES kanvas_user(address),
  provider TEXT NOT NULL,

  sso_id TEXT NOT NULL DEFAULT '',
  sso_type TEXT,
  sso_email TEXT,

  PRIMARY KEY(address, provider, sso_id)
);

COMMIT;

-- ==== DOWN ====

BEGIN;

DROP TABLE wallet_info;

COMMIT;
