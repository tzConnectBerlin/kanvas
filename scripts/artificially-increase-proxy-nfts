#!/usr/bin/env bash

[ "$#" -eq '0' ] && {
  echo 'usage: give the identifier of the proxy nft (ie, the nft that one buys/puts in cart to obtain one of these randomized nfts)'
  exit 1
}

proxy_nft_id=$1

echo "$(cat<<EOF
BEGIN;

INSERT into nft
SELECT distinct on(nft.nft_name)
  nft.id + (SELECT count(1) FROM nft WHERE proxy_nft_id = $proxy_nft_id),
  nft.nft_name,
  nft.description,
  nft.created_at,
  nft.onsale_from,
  nft.artifact_uri,
  nft.display_uri,
  nft.thumbnail_uri,
  nft.metadata_ipfs,
  nft.price,
  nft.editions_size,
  nft.view_count,
  nft.signature,
  nft.onsale_until,
  nft.metadata,
  nft.artifact_ipfs,
  nft.display_ipfs,
  nft.thumbnail_ipfs,
  nft.proxy_nft_id
FROM nft
WHERE proxy_nft_id = $proxy_nft_id
ORDER BY nft.nft_name, nft.id;

INSERT INTO mtm_nft_category (nft_category_id, nft_id)
SELECT 1, nft.id
FROM nft
WHERE proxy_nft_id = $proxy_nft_id
  AND not exists (SELECT 1 FROM mtm_nft_category WHERE nft_id = nft.id);

INSERT INTO proxy_unfold (proxy_nft_id, unfold_nft_id)
SELECT $proxy_nft_id, nft.id
FROM nft
WHERE proxy_nft_id = $proxy_nft_id
  AND not exists (SELECT 1 FROM proxy_unfold WHERE unfold_nft_id = nft.id);

UPDATE nft
SET editions_size = editions_size + (SELECT count(distinct nft_name) FROM nft WHERE proxy_nft_id = $proxy_nft_id)
WHERE id = $proxy_nft_id;

COMMIT;
EOF
)"
