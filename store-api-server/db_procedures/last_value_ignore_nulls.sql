-- credits: https://patternmatchers.wordpress.com/2021/06/11/ignore-nulls-in-postgres/

CREATE OR REPLACE FUNCTION coalesce_r_sfunc(state anyelement, value anyelement)
  RETURNS anyelement
  immutable parallel safe
AS $$
  SELECT COALESCE(value, state);
$$ language sql;

CREATE OR REPLACE AGGREGATE last_value_ignore_nulls(anyelement) (
  sfunc = coalesce_r_sfunc,
  stype = anyelement
);
