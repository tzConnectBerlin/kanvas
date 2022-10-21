-- Migration: delivery-tracking
-- Created at: 2022-10-21 16:37:05
-- ====  UP  ====

BEGIN;

CREATE TABLE nft_order_delivery (
  id SERIAL PRIMARY KEY,

  nft_order_id INT NOT NULL REFERENCES nft_order(id),
  order_nft_id INT NOT NULL REFERENCES nft(id),

  transfer_operation_id INT REFERENCES peppermint.operations(id),
  -- note: transfer_nft_id can differ from order_nft_id, this is eg the case
  -- on purchase of a proxy nft. order_nft_id will then refer to the proxy nft,
  -- and transfer_nft_id will refer to the proxied nft
  transfer_nft_id INT NOT NULL REFERENCES nft(id)
);

COMMIT;

-- ==== DOWN ====

BEGIN;

COMMIT;
