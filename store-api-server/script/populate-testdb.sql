insert into kanvas_user (
  user_name, address, signed_payload
)
values
  ('admin', 'addr', '$2b$10$f/hk.7Hnsqltgzm0JqDJZudecFpUtKP9gPGTrm7BiPaqLGlfJcjXS'), -- pwd: admin
  ('test user', 'tz1', '$2b$10$CKbxQQPEN0uNfazzv89hZ.DXju23yey1XMKzRCca70Z8djcggUpQi'); -- pwd: test


insert into nft (
  editions_size, price, nft_name, ipfs_hash, metadata
)
values
  (1, 1, 'SomeNFT', 'ipfs://somenft', '{"json": "encoded", "I": "guess?"}'),
  (1, 104, 'NFT2', 'ipfs://somenft+', '{"json": "encoded", "I": "guess?"}'),
  (2, 54, 'NFT3', 'ipfs://has-no-category', '{}'),
  (3, 11, 'NFT4', 'ipfs://has-2-categories', '{}'),
  (2, 3, 'Alps', 'ipfs://the-alps', '{}');

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
  category, description
)
values
  ('mountains', 'steep hills that go heigh'),
  ('water', 'its not actually blue');

insert into nft_category (
  category, description, parent
)
values
  ('rock', 'its part of a mountain', 1),
  ('nirvana', 'its part of rock', 3);


insert into mtm_nft_category (
  nft_category_id, nft_id
)
values
  (1, 1),
  (2, 2),
  (2, 3),
  (1, 4),
  (2, 4),
  (1, 5);
