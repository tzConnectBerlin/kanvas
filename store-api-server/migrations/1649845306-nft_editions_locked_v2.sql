-- Migration: nft_editions_locked_v2
-- Created at: 2022-04-13 12:21:46
-- ====  UP  ====

BEGIN;

ALTER FUNCTION nft_editions_locked RENAME TO __nft_editions_locked_v1;
CREATE FUNCTION nft_editions_locked(id INT)
  RETURNS TABLE(reserved BIGINT, owned BIGINT)
AS $$
  SELECT
    (SELECT count(1) FROM mtm_kanvas_user_nft WHERE nft_id = nft_editions_locked.id) as owned,
    (
      SELECT count(1) FROM mtm_cart_session_nft WHERE nft_id = nft_editions_locked.id
    +
      SELECT count(1)
      FROM mtm_nft_order_nft AS mtm
      JOIN payment
        ON payment.nft_order_id = mtm.nft_order_id
      WHERE nft_id = nft_editions_locked.id
        AND payment.status IN ('created', 'processing')
    ) as reserved
$$ LANGUAGE SQL;

COMMIT;

-- ==== DOWN ====

BEGIN;

DROP FUNCTION nft_editions_locked(INT);
ALTER FUNCTION __nft_editions_locked_v1 RENAME TO nft_editions_locked;

COMMIT;
