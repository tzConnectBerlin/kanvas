-- Migration: naturalsort
-- Created at: 2022-04-04 20:11:29
-- ====  UP  ====

BEGIN;

-- source: http://www.rhodiumtoad.org.uk/junk/naturalsort.sql
CREATE FUNCTION naturalsort(TEXT)
  RETURNS BYTEA LANGUAGE SQL IMMUTABLE STRICT AS $f$
  SELECT string_agg(convert_to(coalesce(r[2], length(length(r[1])::TEXT) || length(r[1])::TEXT || r[1]), 'SQL_ASCII'),'\x00')
  from regexp_matches($1, '0*([0-9]+)|([^0-9]+)', 'g') r;
$f$;

COMMIT;

-- ==== DOWN ====

BEGIN;

DROP FUNCTION naturalsort(TEXT);

COMMIT;
