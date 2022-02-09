-- Migration: nft_editions_locked_v1
-- Created at: 2022-02-09 15:59:06
-- ====  UP  ====

BEGIN;

CREATE FUNCTION nft_editions_locked(id INTEGER)
  RETURNS TABLE(reserved BIGINT, owned BIGINT)
AS $$
  SELECT
    (SELECT count(1) FROM mtm_cart_session_nft WHERE nft_id = nft_editions_locked.id) as reserved,
    (SELECT count(1) FROM mtm_kanvas_user_nft WHERE nft_id = nft_editions_locked.id) as owned
$$ LANGUAGE SQL;

COMMIT;

-- ==== DOWN ====

BEGIN;

DROP FUNCTION nft_editions_locked(INTEGER[], TEXT, TEXT);

COMMIT;
