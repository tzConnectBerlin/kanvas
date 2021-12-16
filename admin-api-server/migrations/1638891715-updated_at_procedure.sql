-- Migration: updated_at procedure
-- Created at: 2021-12-07 16:41:55
-- ====  UP  ====

BEGIN;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   IF row(NEW.*) IS DISTINCT FROM row(OLD.*) THEN
      NEW.updated_at = now(); 
      RETURN NEW;
   ELSE
      RETURN OLD;
   END IF;
END;
$$ language 'plpgsql';

COMMIT;

-- ==== DOWN ====

BEGIN;
DROP FUNCTION IF EXISTS update_updated_at_column;
COMMIT;
