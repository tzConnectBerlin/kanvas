DROP FUNCTION IF EXISTS nft_ids_filtered;

CREATE FUNCTION nft_ids_filtered(
    address TEXT, categories INTEGER[],
    price_at_least NUMERIC, price_at_most NUMERIC,
    availability TEXT[], ending_soon_duration INTERVAL,
    order_by TEXT, order_direction TEXT,
    "offset" INTEGER, "limit" INTEGER,
    until TIMESTAMP WITHOUT TIME ZONE,
    minter_address TEXT)
  RETURNS TABLE(nft_id nft.id%TYPE, total_nft_count bigint)
AS $$
BEGIN
  IF order_direction NOT IN ('asc', 'desc') THEN
    RAISE EXCEPTION 'nft_ids_filtered(): invalid order_direction';
  END IF;
  IF NOT (availability <@ '{soldOut, onSale, upcoming, endingSoon}'::text[]) THEN
    RAISE EXCEPTION 'nft_ids_filtered(): invalid availability';
  END IF;
  RETURN QUERY EXECUTE '
    SELECT
      nft_id,
      total_nft_count
    FROM (
      SELECT
        nft.id as nft_id,
        nft.created_at as nft_created_at,
        COUNT(1) OVER () AS total_nft_count
      FROM nft
      JOIN mtm_nft_category
        ON mtm_nft_category.nft_id = nft.id
      LEFT JOIN mtm_kanvas_user_nft
        ON mtm_kanvas_user_nft.nft_id = nft.id
      LEFT JOIN kanvas_user
        ON mtm_kanvas_user_nft.kanvas_user_id = kanvas_user.id
      WHERE ($1 IS NULL OR nft.created_at <= $1)
        AND ($2 IS NULL OR (
              EXISTS (
                SELECT 1
                FROM onchain_kanvas."storage.ledger_live"
                WHERE idx_assets_address = $2
                  AND idx_assets_nat = nft.id
              ) OR (
                purchased_editions_pending_transfer(nft.id, $2, $10) > 0
              )
            ))
        AND ($3 IS NULL OR nft_category_id = ANY($3))
        AND ($4 IS NULL OR nft.price >= $4)
        AND ($5 IS NULL OR nft.price <= $5)
        AND ($6 IS NULL OR (
              (' || quote_literal('onSale') || ' = ANY($6) AND (
                    (nft.onsale_from IS NULL OR nft.onsale_from <= now() AT TIME ZONE ' || quote_literal('UTC') || ')
                AND (nft.onsale_until IS NULL OR nft.onsale_until > now())
                AND ((SELECT reserved + owned FROM nft_editions_locked(nft.id)) < nft.editions_size)
              )) OR
              (' || quote_literal('soldOut') || ' = ANY($6) AND (
                (
                  SELECT reserved + owned FROM nft_editions_locked(nft.id)
                ) >= nft.editions_size
              )) OR
              (' || quote_literal('upcoming') || ' = ANY($6) AND (
                nft.onsale_from > now() AT TIME ZONE ' || quote_literal('UTC') || '
              )) OR
              (' || quote_literal('endingSoon') || ' = ANY($6) AND (
                  nft.onsale_until BETWEEN (now() AT TIME ZONE ' || quote_literal('UTC') || ') AND (now() AT TIME ZONE ' || quote_literal('UTC') || ' + $7)
              ))
            ))
      GROUP BY nft.id, nft.created_at
      ORDER BY ' || quote_ident(order_by) || ' ' || order_direction || '
      OFFSET $8
      LIMIT  $9
    ) q'
    USING until, address, categories, price_at_least, price_at_most, availability, ending_soon_duration, "offset", "limit", minter_address;
END
$$
LANGUAGE plpgsql;
