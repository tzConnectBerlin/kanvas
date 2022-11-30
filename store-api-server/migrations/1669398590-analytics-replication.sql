-- Migration: analytics-replication
-- Created at: 2022-11-25 18:49:50
-- ====  UP  ====

BEGIN;

ALTER PUBLICATION store_pub ADD TABLE peppermint.operations;
ALTER PUBLICATION store_pub ADD TABLE nft_order_delivery;

COMMIT;

-- ==== DOWN ====

BEGIN;

ALTER PUBLICATION store_pub DROP TABLE peppermint.operations;
ALTER PUBLICATION store_pub DROP TABLE nft_order_delivery;

COMMIT;
