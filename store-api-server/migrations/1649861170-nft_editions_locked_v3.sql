-- Migration: nft_editions_locked_v3
-- Created at: 2022-04-13 16:46:10
-- ====  UP  ====

BEGIN;

ALTER FUNCTION nft_editions_locked RENAME TO __nft_editions_locked_v2;
CREATE FUNCTION nft_editions_locked(INT)
  RETURNS TABLE(reserved BIGINT, owned BIGINT)
AS $$
  SELECT
    count(cart_nfts) FILTER (WHERE payment IS NULL)
    + count(order_nfts) FILTER (WHERE payment IS NOT NULL) AS reserved,
    (SELECT count(1) FROM mtm_kanvas_user_nft WHERE nft_id = $1) AS owned
  FROM cart_session AS cart
  LEFT JOIN mtm_cart_session_nft AS cart_nfts
    ON  cart_nfts.cart_session_id = cart.id
    AND cart_nfts.nft_id = $1

  LEFT JOIN nft_order
    ON nft_order.id = cart.order_id
  LEFT JOIN mtm_nft_order_nft AS order_nfts
    ON  order_nfts.nft_order_id = nft_order.id
    AND order_nfts.nft_id = $1
  LEFT JOIN payment
    ON  payment.nft_order_id = nft_order.id
    AND payment.status IN ('created', 'processing')
$$ LANGUAGE SQL;

COMMIT;

-- ==== DOWN ====

BEGIN;

DROP FUNCTION nft_editions_locked(INT);
ALTER FUNCTION __nft_editions_locked_v2 RENAME TO nft_editions_locked;

COMMIT;
