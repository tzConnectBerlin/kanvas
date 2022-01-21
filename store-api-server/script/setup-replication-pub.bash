#!/usr/bin/env bash
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
cd $SCRIPT_DIR

./wait-db.bash

psql -c '
CREATE PUBLICATION store_pub FOR TABLE
  cart_session,
  kanvas_user,
  mtm_cart_session_nft,
  mtm_kanvas_user_nft,
  mtm_nft_category,
  mtm_nft_order_nft,
  mtm_kanvas_user_user_role,
  nft,
  nft_category,
  nft_order,
  payment,
  user_role;
'
