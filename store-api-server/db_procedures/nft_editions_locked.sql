CREATE OR REPLACE FUNCTION nft_editions_locked(nft_id_input INT)
  RETURNS TABLE(reserved BIGINT, owned BIGINT)
  STABLE PARALLEL SAFE
AS $$
  WITH nft_ids AS (
    SELECT
      nft_id_input AS id
    UNION ALL
    SELECT
      unfold_nft_id AS id
    FROM proxy_unfold
    WHERE proxy_nft_id = nft_id_input
  )
  SELECT
    (
      SELECT count(1) AS num
      FROM mtm_cart_session_nft AS cart_nfts
      JOIN cart_session AS cart
        ON cart.id = cart_nfts.cart_session_id
      LEFT JOIN nft_order
        ON nft_order.id = cart.order_id
      LEFT JOIN payment
        ON  payment.nft_order_id = nft_order.id
        AND payment.status IN ('created', 'promised', 'processing', 'succeeded')
      WHERE cart_nfts.nft_id = nft_id_input
        AND payment.id IS NULL
    ) + (
      SELECT count(DISTINCT order_nfts.id) AS num
      FROM mtm_nft_order_nft AS order_nfts
      WHERE order_nfts.nft_id = nft_id_input
        AND EXISTS (
        SELECT 1
        FROM payment
        WHERE payment.nft_order_id = order_nfts.nft_order_id
          AND payment.status IN ('created', 'promised', 'processing', 'succeeded')
      ) AND NOT EXISTS (
        SELECT 1
        FROM nft_order_delivery AS delivery
        WHERE delivery.nft_order_id = order_nfts.nft_order_id
      )
    ) AS reserved,
    (SELECT count(1) FROM nft_ids JOIN mtm_kanvas_user_nft ON nft_id = nft_ids.id) AS owned
$$ LANGUAGE SQL;
