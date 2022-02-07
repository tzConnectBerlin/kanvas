-- Migration: bugfix_locked_editions_function
-- Created at: 2022-02-07 15:03:20
-- ====  UP  ====

BEGIN;

ALTER FUNCTION nft_editions_locked RENAME TO __nft_editions_locked_v1;
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
ALTER FUNCTION __nft_editions_locked_v1 RENAME TO nft_editions_locked;

COMMIT;
