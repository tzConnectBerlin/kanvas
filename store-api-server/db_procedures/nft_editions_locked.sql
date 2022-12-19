DROP FUNCTION IF EXISTS nft_editions_locked;
DROP FUNCTION IF EXISTS nft_editions_locked_no_proxy;

CREATE FUNCTION nft_editions_locked(nft_id INT)
  RETURNS TABLE(reserved BIGINT, owned BIGINT)
  PARALLEL SAFE
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
    (
      SELECT count(1) AS num
      FROM nft_ids
      JOIN mtm_cart_session_nft AS cart_nfts
        ON cart_nfts.nft_id = nft_ids.id
      JOIN cart_session AS cart
        ON cart.id = cart_nfts.cart_session_id
      LEFT JOIN nft_order
        ON nft_order.id = cart.order_id
      LEFT JOIN payment
        ON  payment.nft_order_id = nft_order.id
        AND payment.status IN ('created', 'promised', 'processing')
      WHERE payment.id IS NULL
    ) + (
      SELECT count(DISTINCT nft_order.id) AS num
      FROM nft_order
      JOIN mtm_nft_order_nft AS order_nfts
        ON  order_nfts.nft_order_id = nft_order.id
        AND order_nfts.nft_id = $1
      JOIN payment
        ON  payment.nft_order_id = nft_order.id
        AND payment.status IN ('created', 'promised', 'processing')
    ) AS reserved,
    (SELECT count(1) FROM nft_ids JOIN mtm_kanvas_user_nft ON nft_id = nft_ids.id) AS owned
$$ LANGUAGE SQL;
