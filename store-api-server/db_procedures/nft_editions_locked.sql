DROP FUNCTION IF EXISTS nft_editions_locked;
DROP FUNCTION IF EXISTS nft_editions_locked_no_proxy;

CREATE FUNCTION nft_editions_locked_no_proxy(INT)
  RETURNS TABLE(reserved BIGINT, owned BIGINT)
AS $$
  SELECT
    cart_nfts.num + order_nfts.num AS reserved,
    (SELECT count(1) FROM mtm_kanvas_user_nft WHERE nft_id = $1) AS owned
  FROM (
    SELECT count(1) AS num
    FROM cart_session AS cart
    JOIN mtm_cart_session_nft AS cart_nfts
      ON  cart_nfts.cart_session_id = cart.id
      AND cart_nfts.nft_id = $1
    LEFT JOIN nft_order
      ON nft_order.id = cart.order_id
    LEFT JOIN payment
      ON  payment.nft_order_id = nft_order.id
      AND payment.status IN ('created', 'promised', 'processing')
    WHERE payment.id IS NULL
  ) cart_nfts, (
    SELECT count(DISTINCT nft_order.id) AS num
    FROM nft_order
    JOIN mtm_nft_order_nft AS order_nfts
      ON  order_nfts.nft_order_id = nft_order.id
      AND order_nfts.nft_id = $1
    JOIN payment
      ON  payment.nft_order_id = nft_order.id
      AND payment.status IN ('created', 'promised', 'processing')
  ) order_nfts
$$ LANGUAGE SQL;

CREATE FUNCTION nft_editions_locked(nft_id INT)
  RETURNS TABLE(reserved BIGINT, owned BIGINT)
AS $$
  WITH nft_ids AS (
    SELECT
      nft_id AS id
    UNION ALL
    SELECT
      unfold_nft_id AS id
    FROM proxy_unfold
    WHERE proxy_nft_id = nft_id
  )
  SELECT
    sum(reserved) AS reserved,
    sum(owned) AS owned
  FROM nft_ids, nft_editions_locked_no_proxy(nft_ids.id)
$$ LANGUAGE SQL;
