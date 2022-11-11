-- Migration: delivery-tracking
-- Created at: 2022-10-21 16:37:05
-- ====  UP  ====

BEGIN;

CREATE TABLE nft_order_delivery (
  id SERIAL PRIMARY KEY,

  nft_order_id INT NOT NULL REFERENCES nft_order(id),
  order_nft_id INT NOT NULL REFERENCES nft(id),

  transfer_operation_id INT REFERENCES peppermint.operations(id),
  -- note: transfer_nft_id can differ from order_nft_id, this is the case
  -- on purchase of a proxy nft. order_nft_id will then refer to the proxy nft,
  -- and transfer_nft_id will refer to the proxied nft
  transfer_nft_id INT NOT NULL REFERENCES nft(id),

  UNIQUE (nft_order_id, order_nft_id)
);

CREATE TABLE __nft_order_delivery_delisted (LIKE nft_order_delivery);

COMMIT;

-- ==== DOWN ====

BEGIN;

DROP TABLE nft_order_delivery;
DROP TABLE __nft_order_delivery_delisted;

COMMIT;
