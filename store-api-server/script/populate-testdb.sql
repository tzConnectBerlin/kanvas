insert into kanvas_user (
  user_name, address, signed_payload
)
values
  ('admin', 'addr', '$2b$10$f/hk.7Hnsqltgzm0JqDJZudecFpUtKP9gPGTrm7BiPaqLGlfJcjXS'), -- pwd: admin
  ('test user', 'tz1', '$2b$10$CKbxQQPEN0uNfazzv89hZ.DXju23yey1XMKzRCca70Z8djcggUpQi'); -- pwd: test


insert into nft (
  signature, editions_size, price, nft_name, ipfs_hash, artifact_uri, description
)
values
  ('nosig', 4, 1, 'Cartoon', 'ipfs://.....', 'https://images.unsplash.com/photo-1603344204980-4edb0ea63148?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8ZHJhd2luZ3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=900&q=60', 'Hey guys, here s the WL team ready to write some more code !'),
  ('nosig', 2, 78, 'Framley', 'ipfs://.....', 'https://images.unsplash.com/photo-1582201942988-13e60e4556ee?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2202&q=80', 'Framley Parsonage - Was it not a Lie?,1860. John Everett Millais (d.1896) and Dalziel Brothers'),
  ('nosig', 6, 104, 'Internet', 'ipfs://.....', 'https://images.unsplash.com/photo-1585007600263-71228e40c8d1?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=3870&q=80', 'Misinformation on the web. Illustration by Carlos PX'),
  ('nosig', 8, 43, 'The cat & the city', 'ipfs://.....', 'https://images.unsplash.com/photo-1615639164213-aab04da93c7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1974&q=80', 'What s better then a cat in a city ?'),
  ('nosig', 8, 2, 'Michael Angelo', 'ipfs://.....', 'https://images.unsplash.com/flagged/photo-1572392640988-ba48d1a74457?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2160&q=80', 'Michael Angelo s painting on top of the Palace of Versailles'),
  ('nosig', 8, 17, 'No title', 'ipfs://.....', 'https://images.unsplash.com/photo-1625757870391-072d1ed8decf?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2618&q=80', 'Peinture murale réalisée par l’artiste Hopare Né en 1989 à Paris, Alexandre Monteiro grandit à Limours, dans l’Essonne, petite commune du sud-ouest parisien bordé par la forêt de Rambouillet. Tombé dans l’univers du graffiti à l’adolescence, il est aujourd’hui un vrai addict de cet art qu’il vit au quotidien. Formé à l’école d’un autre artiste de rue français, Shaka, Hopare peint, expose ses œuvres et participe aujourd’hui à des projets d’architectures d’intérieur, de décoration ou de stylisme dans le textile. Figure montante du street art en France, Hopare puise dans l’architecture urbaine et l’agitation l’inspiration qui fera naître des murs au graphisme stylé et percutant.'),
  ('nosig', 8, 98, 'He was once 12', 'ipfs://.....', 'https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTJ8fHBhaW50aW5nc3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=900&q=60', 'Paintings from my twelve year old nephew'),
  ('nosig', 8, 232, 'An didn t stop improving', 'ipfs://.....', 'https://images.unsplash.com/photo-1544967082-d9d25d867d66?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MjB8fHBhaW50aW5nc3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=900&q=60', 'Paintings from my twelve year old nephew'),
  ('nosig', 8, 572, 'Fruits & Veggies', 'ipfs://.....', 'https://images.unsplash.com/photo-1578321926534-133bb2a9f080?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2568&q=80', 'Rudolph II as Vertumnus by Giuseppe Arcimboldi. Creation date 1590 1591. Vertumnus is an allegorical portrait of Arcimboldo’s employer, the Holy Roman Emperor Rudolph II. Provided by Schoklosters Castle. PD for Public Domain Mark '),
  ('nosig', 8, 92, 'Antonin DVORAK', 'ipfs://.....', 'https://images.unsplash.com/photo-1638186824584-6d6367254927?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHx0b3BpYy1mZWVkfDJ8YkRvNDhjVWh3bll8fGVufDB8fHx8&auto=format&fit=crop&w=900&q=60', 'Bronze sculpture of Antonin DVORAK who lived from 1841 - 1904'),
  ('nosig', 8, 41, 'Korean Language', 'ipfs://.....', 'https://images.unsplash.com/photo-1506809211073-d0785aaad75e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2656&q=80', 'Inventor of the korean language. This is the statue in Seoul South Korea of him.'),
  ('nosig', 8, 36, 'TOCABI', 'ipfs://.....', 'https://images.unsplash.com/photo-1633957897986-70e83293f3ff?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1986&q=80', 'The humanoid robot TOCABI. I both led the design and took the photo. It is a full-size (real) humanoid robot that can also be used as an avatar for teleoperation.'),
  ('nosig', 8, 642, 'Lost', 'ipfs://.....', 'https://images.unsplash.com/photo-1599790772272-d1425cd3242e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1yZWxhdGVkfDV8fHxlbnwwfHx8fA%3D%3D&auto=format&fit=crop&w=900&q=60', 'You look lost in thought.'),
  ('nosig', 8, 3432, 'Light Festival - Korea', 'ipfs://.....', 'https://images.unsplash.com/photo-1508454868649-abc39873d8bf?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=3870&q=80', 'In South Korea these sculptures are part of the light festival. Dragon vs. Tiger.'),
  ('nosig', 8, 62, 'Fancy 3D', 'ipfs://.....', 'https://images.unsplash.com/photo-1625014618427-fbc980b974f5?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=3764&q=80', 'Fancy, fancy...'),
  ('nosig', 8, 12, 'The meta origin', 'ipfs://.....', 'https://images.unsplash.com/photo-1635002962487-2c1d4d2f63c2?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2960&q=80', 'This was made before Zuckerberg announced Meta and its logo - honest! '),
  ('nosig', 8, 378, 'Blue', 'ipfs://.....', 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2235&q=80', 'The sea is real'),
  ('nosig', 8, 902, 'Not afraid', 'ipfs://.....', 'https://images.unsplash.com/photo-1635321856172-e80100c72ce9?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2000&q=80', 'That s the way we roll'),
  ('nosig', 2, 324, 'Tennis', 'ipfs://has-no-category', 'https://images.unsplash.com/photo-1529926706528-db9e5010cd3e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2843&q=80', 'Too old, please bring me to the digital world' ),
  ('nosig', 2, 534, 'Umbrella', 'ipfs://has-no-category', 'https://images.unsplash.com/photo-1517213628252-ae2125f4f270?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTB8fHBob3RvZ3JhcGh5JTIwYWJzdHJhY3R8ZW58MHx8MHx8&auto=format&fit=crop&w=900&q=60', 'Pioufff, Shot it from 17 floor.' ),
  ('nosig', 2, 564, 'Chef looking down', 'ipfs://has-no-category', 'https://images.unsplash.com/photo-1520586501-5825e619597e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1974&q=80', 'Look intense in the kitchen' ),
  ('nosig', 2, 5324, 'Palm', 'ipfs://has-no-category', 'https://images.unsplash.com/photo-1563481814374-0ecf7590fe83?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mjd8fHBob3RvZ3JhcGh5JTIwYWJzdHJhY3R8ZW58MHx8MHx8&auto=format&fit=crop&w=900&q=60', 'Palm Leaf' ),
  ('nosig', 2, 64, 'Walking in to the dark', 'ipfs://has-no-category', 'https://images.unsplash.com/photo-1511813595503-79ab28b6a4b2?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1974&q=80', 'Not afraid !' ),
  ('nosig', 2, 754, 'Elegance', 'ipfs://has-no-category', 'https://images.unsplash.com/photo-1495264537403-93658651aaea?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2564&q=80', 'No description needed' ),
  ('nosig', 2, 58, 'Taipei', 'ipfs://has-no-category', 'https://images.unsplash.com/photo-1621797334469-74c5fa26df05?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1974&q=80', 'In the rain and the dark' ),
  ('nosig', 2, 553, 'Chateau', 'ipfs://has-no-category', 'https://images.unsplash.com/photo-1612962030417-a76214fc1126?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1974&q=80', 'Well, the picture speaks for itself' ),
  ('nosig', 2, 12, 'Skyline', 'ipfs://has-no-category', 'https://images.unsplash.com/photo-1622216899879-89c73e9c46d6?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1974&q=80', 'Beautiful Toronto skyline' ),
  ('nosig', 2, 124, 'Tak Hing', 'ipfs://has-no-category', 'https://images.unsplash.com/photo-1620175527578-3a01876fd6c7?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mzd8fHBob3RvZ3JhcGh5JTIwbGFuZHNjYXBlfGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=900&q=60', 'Light description' ),
  ('nosig', 2, 5544, 'Natural Beauty', 'ipfs://has-no-category', 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MjZ8fHBvcnRyYWl0fGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=900&q=60', 'A beautiful image taken during a photographic rehearsal amidst the pines. The photo shows the natural beauty of redheads and their beautiful freckles. Photographed by Gabriel Silvério. Brazil.' ),
  ('nosig', 2, 76, 'That s a hell of a moustache', 'ipfs://has-no-category', 'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2960&q=80', 'It took 6 months, it was long, painful but in the end, it worth it.' ),
  ('nosig', 2, 864, 'Another Beauty', 'ipfs://has-no-category', 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2960&q=80', 'A beautiful image taken during a photographic rehearsal amidst the pines. The photo shows the natural beauty of redheads and their beautiful freckles. Photographed by Gabriel Silvério. Brazil.' ),
  ('nosig', 2, 90, 'Wet & light', 'ipfs://has-no-category', 'https://images.unsplash.com/photo-1548387834-7bf05019e89b?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1yZWxhdGVkfDJ8fHxlbnwwfHx8fA%3D%3D&auto=format&fit=crop&w=900&q=60', ' ' ),
  ('nosig', 2, 144, 'Chilling', 'ipfs://has-no-category', 'https://images.unsplash.com/photo-1481016570479-9eab6349fde7?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1974&q=80', 'During 3 months in Mexico, we developped series of contemporary objects. Craftsmen we worked with were extraordinary people making very ordinary things. Heirs of the tradition, of the culture, they keep going all alone, last reprensentatives of their endangered kind. Products from Mexico deeply embedded in the local culture, and traditional crafts, to remember that behind the little things of daily life, small hands are at work.
' ),
  ('nosig', 2, 54, 'Outstanding wall', 'ipfs://has-no-category', 'https://images.unsplash.com/photo-1509805225007-73e8ba4b5be8?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MjA1fHxhcHBsaWVkJTIwYXJ0fGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=900&q=60', 'Where comfort meets design, design meets art and art meets photography' );


update nft
set onsale_from = now() AT TIME ZONE 'UTC' + interval '1 hour',
    description = 'its a mountain'
where id = 3;

-- lazy way of upping these very low prices now that we're taking into account decimals in the API
update nft set price = price * 10;

insert into nft_category (
  category, description
)
values
  ('Fine Art', 'A collection of fine art devided in several categories'),
  ('Visual Art', 'Not actually visual'),
  ('Applied Art', 'Not actually visual');

insert into nft_category (
  category, description, parent
)
values
  ('Drawing', 'Sub fine art category', 1),
  ('Painting', 'Sub fine art category', 1),
  ('Sculpture', 'Sub fine art category', 1),
  ('Digital', 'Sub visual art category', 2),
  ('Photography', 'Sub visual art category', 2),
  ('Abstract', 'Sub photography category', 8),
  ('Landscape', 'Sub photography category', 8),
  ('Portrait', 'Sub photography category', 8),
  ('Cities', 'Sub photography category', 8),
  ('Honk Kong', 'Sub cities category', 12),
  ('Toronto', 'Sub cities category', 12),
  ('London', 'Sub cities category', 12),
  ('Black & White', 'Sub photography category', 8);

insert into mtm_nft_category (
  nft_category_id, nft_id
)
values
  (4, 1),
  (4, 2),
  (4, 3),
  (4, 4),
  (5, 5),
  (5, 6),
  (5, 7),
  (5, 8),
  (5, 9),
  (6, 10),
  (6, 11),
  (6, 12),
  (6, 13),
  (6, 14),
  (7, 15),
  (7, 16),
  (7, 17),
  (7, 18),
  (9, 19),
  (9, 20),
  (9, 21),
  (9, 22),
  (9, 23),
  (9, 24),
  (10, 25),
  (10, 26),
  (10, 27),
  (10, 28),
  (11, 29),
  (11, 30),
  (11, 31),
  (13, 28),
  (13, 32),
  (14, 27),
  (15, 23),
  (16, 20),
  (16, 22),
  (3, 33),
  (3, 34);



