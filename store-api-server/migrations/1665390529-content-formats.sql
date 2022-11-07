-- Migration: content-formats
-- Created at: 2022-10-10 10:28:49
-- ====  UP  ====

BEGIN;

CREATE TABLE format (
  id SERIAL PRIMARY KEY,

  content_name TEXT NOT NULL, -- eg: artifact, or display, or thumbnail
  attribute TEXT NOT NULL,
  value JSONB NOT NULL,

  UNIQUE (content_name, attribute, value)
);

CREATE TABLE mtm_nft_format (
  nft_id INT REFERENCES nft(id),
  format_id INT REFERENCES format(id)
);

CREATE TABLE __mtm_nft_format_delisted (LIKE mtm_nft_format);

COMMIT;

-- ==== DOWN ====

BEGIN;

DROP TABLE __mtm_nft_format_delisted;
DROP TABLE mtm_nft_format;
DROP TABLE format;

COMMIT;
