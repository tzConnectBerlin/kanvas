insert into kanvas_user (
  id, address, signed_payload
)
values
  (1, 'addr', 'admin'),
  (2, 'tz1', 'pass');


insert into nft (
  id, nft_name, ipfs_hash, metadata
)
values
  (1, 'SomeNFT', 'ipfs://somenft', '{"json": "encoded", "I": "guess?"}'),
  (2, 'NFT2', 'ipfs://somenft+', '{"json": "encoded", "I": "guess?"}'),
  (3, 'NFT3', 'ipfs://has-no-category', '{}'),
  (4, 'NFT4', 'ipfs://has-2-categories', '{}'),
  (5, 'Alps', 'ipfs://the-alps', '{}');

insert into mtm_kanvas_user_nft (
  kanvas_user_id, nft_id
)
values
  (1, 1),
  (1, 2),
  (2, 3),
  (2, 4),
  (1, 5);

insert into nft_category (
  id, category, description
)
values
  (1, 'mountains', 'steep hills that go heigh'),
  (2, 'water', 'its not actually blue');


insert into mtm_nft_category (
  nft_category_id, nft_id
)
values
  (1, 1),
  (2, 2),
  (1, 4),
  (2, 4),
  (1, 5);
