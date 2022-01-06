-- Migration: nft_trigger
-- Created at: 2021-12-07 16:44:06
-- ====  UP  ====

BEGIN;
-- set trigger
CREATE TRIGGER update_nft_updated_at BEFORE UPDATE ON nft FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

COMMIT;

-- ==== DOWN ====

BEGIN;
DROP TRIGGER IF EXITS update_nft_updated_at;
COMMIT;
