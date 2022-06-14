import { Test, TestingModule } from '@nestjs/testing';
import {
  ConsoleLogger,
  Logger,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { RATE_LIMIT } from '../src/constants';
import {
  SIGNATURE_PREFIX_CREATE_NFT,
  SIGNATURE_PREFIX_DELIST_NFT,
  SIGNATURE_PREFIX_RELIST_NFT,
} from 'kanvas-api-lib';
import {
  PaymentProvider,
  PaymentService,
  PaymentStatus,
} from '../src/payment/service/payment.service';
import { UserEntity } from '../src/user/entity/user.entity';
import { UserService } from '../src/user/service/user.service';
import { assertEnv, sleep } from '../src/utils';
import sotez from 'sotez';
const { cryptoUtils } = sotez;

let anyTestFailed = false;
const skipOnPriorFail = (name: string, action: any) => {
  // Note: this will mark any test after a failed test as
  // succesful, not great, but it's the best that seems possible
  // with jest right now
  test(name, async () => {
    if (!anyTestFailed) {
      try {
        await action();
      } catch (error) {
        anyTestFailed = true;
        throw error;
      }
    }
  });
};

describe('AppController (e2e)', () => {
  let app: any;
  let paymentService: PaymentService;
  let userService: UserService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    paymentService = await moduleFixture.get(PaymentService);
    userService = await moduleFixture.get(UserService);

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.enableShutdownHooks();
    await app.init();
  });
  afterEach(async () => {
    await app.close();
  });

  skipOnPriorFail('should be defined', () => expect(app).toBeDefined());

  it(`/ (GET) => NOT FOUND (make sure the nestjs's Hello World page is gone)`, () => {
    return request(app.getHttpServer()).get('/').expect(404);
  });

  // Note:
  // - these tests expect responses related to a database that has been filled
  //   with data in store-api-server/script/populate-testdb.sql

  skipOnPriorFail(
    '/nfts?orderBy=view is determined by number of POST /nfts/:id per id',
    async () => {
      const posts = await Promise.all([
        request(app.getHttpServer()).post('/nfts/1'),
        request(app.getHttpServer()).post('/nfts/23'),
        request(app.getHttpServer()).post('/nfts/23'),
        request(app.getHttpServer()).post('/nfts/23'),
        request(app.getHttpServer()).post('/nfts/3'),
        request(app.getHttpServer()).post('/nfts/3'),

        request(app.getHttpServer()).post('/nfts/1'),
        request(app.getHttpServer()).post('/nfts/23'),
        request(app.getHttpServer()).post('/nfts/23'),
        request(app.getHttpServer()).post('/nfts/23'),
        request(app.getHttpServer()).post('/nfts/3'),
        request(app.getHttpServer()).post('/nfts/3'),

        request(app.getHttpServer()).post('/nfts/7'),
        request(app.getHttpServer()).post('/nfts/18'),
        request(app.getHttpServer()).post('/nfts/19'),
        request(app.getHttpServer()).post('/nfts/22'),
        request(app.getHttpServer()).post('/nfts/27'),
        request(app.getHttpServer()).post('/nfts/28'),
      ]);

      for (const post of posts) {
        expect(post.statusCode).toEqual(201);
      }

      // have to sleep here for a bit, because we (on purpose) don't await
      // on the nft increment view count query in POST /nfts/:id calls
      await sleep(2000);

      const res = await request(app.getHttpServer())
        .get('/nfts')
        .query({ orderBy: 'views', orderDirection: 'desc', pageSize: '3' });
      expect(res.statusCode).toEqual(200);
      expect(res.body.nfts.map((elem: any) => elem.id)).toStrictEqual([
        23, 3, 1,
      ]);
    },
  );

  skipOnPriorFail(
    'verify caching works as intended on one of the cached endpoints',
    async () => {
      let res = await request(app.getHttpServer())
        .get('/nfts')
        .query({ orderBy: 'views', orderDirection: 'desc', pageSize: '3' });
      expect(res.statusCode).toEqual(200);
      expect(res.body.nfts.map((elem: any) => elem.id)).toStrictEqual([
        23, 3, 1,
      ]);

      await Promise.all([
        request(app.getHttpServer()).post('/nfts/2'),
        request(app.getHttpServer()).post('/nfts/2'),
        request(app.getHttpServer()).post('/nfts/2'),
      ]);
      await sleep(100);

      res = await request(app.getHttpServer())
        .get('/nfts')
        .query({ orderBy: 'views', orderDirection: 'desc', pageSize: '3' });
      expect(res.statusCode).toEqual(200);
      expect(res.body.nfts.map((elem: any) => elem.id)).toStrictEqual([
        23,
        3,
        1, // because of caching we expect no mention of nft 2 here
      ]);

      res = await request(app.getHttpServer())
        .get('/nfts')
        .query({ orderBy: 'views', orderDirection: 'desc', pageSize: '4' });
      expect(res.statusCode).toEqual(200);
      expect(res.body.nfts.map((elem: any) => elem.id)).toStrictEqual([
        23,
        3,
        2,
        1, // because of different key, old cache isn't hit and we get an up to date result
      ]);

      await sleep(1000); // 1 sec, the .env.test file specifies CACHE_TTL to 1 sec
      res = await request(app.getHttpServer())
        .get('/nfts')
        .query({ orderBy: 'views', orderDirection: 'desc', pageSize: '3' });
      expect(res.statusCode).toEqual(200);
      expect(res.body.nfts.map((elem: any) => elem.id)).toStrictEqual([
        23,
        3,
        2, // because of CACHE_TTL timed out of the outdated cache entry, we get an up to date result
      ]);
    },
  );

  skipOnPriorFail('/nfts/:id (non existing id => BAD REQUEST)', async () => {
    const res = await request(app.getHttpServer()).post('/nfts/0');
    expect(res.statusCode).toEqual(400);
  });

  skipOnPriorFail('/nfts/:id (existing id => OK)', async () => {
    const res = await request(app.getHttpServer()).post('/nfts/1');
    expect(res.statusCode).toEqual(201);

    // cannot test this accurately because currently the testdb is populated
    // with now() timestamps
    expect(res.body.createdAt).toBeGreaterThan(0);
    delete res.body.createdAt;
    expect(res.body.launchAt).toBeGreaterThan(0);
    delete res.body.launchAt;

    if (typeof res.body.onsaleUntil !== 'undefined') {
      expect(res.body.onsaleUntil).toBeGreaterThan(0);
      delete res.body.onsaleUntil;
    }

    expect(res.body).toStrictEqual({
      id: 1,
      name: 'Cartoon',
      description:
        'Hey guys, here s the WL team ready to write some more code !',
      ipfsHash: null,
      artifactUri:
        'https://images.unsplash.com/photo-1603344204980-4edb0ea63148?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8ZHJhd2luZ3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=900&q=60',
      displayUri:
        'https://images.unsplash.com/photo-1603344204980-4edb0ea63148?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8ZHJhd2luZ3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=900&q=60',
      thumbnailUri:
        'https://images.unsplash.com/photo-1603344204980-4edb0ea63148?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8ZHJhd2luZ3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=900&q=60',
      price: '0.10',
      editionsSize: 4,
      editionsAvailable: 4,
      categories: [
        { id: 4, name: 'Drawing', description: 'Sub fine art category' },
      ],
    });
  });

  skipOnPriorFail(
    '/nfts without any filter is OK, becomes a paginated nfts browser without any filter',
    async () => {
      const PAGE_SIZE = 10;
      const res = await request(app.getHttpServer())
        .get('/nfts')
        .query({ pageSize: `${PAGE_SIZE}` });
      expect(res.statusCode).toEqual(200);

      expect(res.body.nfts.length).toEqual(PAGE_SIZE);

      expect(res.body.nfts.map((elem: any) => elem.id)).toStrictEqual([
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
      ]);
    },
  );

  skipOnPriorFail(
    '/nfts with address filter (OK when 0 nfts owned)',
    async () => {
      const res = await request(app.getHttpServer())
        .get('/nfts')
        .query({ userAddress: 'addr' });
      expect(res.statusCode).toEqual(200);

      expect(res.body).toStrictEqual({
        currentPage: 1,
        numberOfPages: 0,
        totalNftCount: 0,
        nfts: [],
        lowerPriceBound: '0.00',
        upperPriceBound: '0.00',
      });
    },
  );

  skipOnPriorFail(
    '/nfts with address filter (OK address doesnt even belong to any user registered in our system))',
    async () => {
      const res = await request(app.getHttpServer())
        .get('/nfts')
        .query({ userAddress: 'doesnotexist' });
      expect(res.statusCode).toEqual(200);

      expect(res.body).toStrictEqual({
        currentPage: 1,
        numberOfPages: 0,
        totalNftCount: 0,
        nfts: [],
        lowerPriceBound: '0.00',
        upperPriceBound: '0.00',
      });
    },
  );

  skipOnPriorFail(
    '/nfts with categories filter (categories is list of OR, not AND, ie an nft must belong to at least one of the given categories))',
    async () => {
      const res = await request(app.getHttpServer())
        .get('/nfts')
        .query({ categories: '4,6' });
      expect(res.statusCode).toEqual(200);

      for (const i in res.body.nfts) {
        expect(res.body.nfts[i].createdAt).toBeGreaterThan(0);
        expect(res.body.nfts[i].launchAt).toBeGreaterThan(0);
        delete res.body.nfts[i].createdAt;
        delete res.body.nfts[i].launchAt;

        if (typeof res.body.nfts[i].onsaleUntil !== 'undefined') {
          expect(res.body.nfts[i].onsaleUntil).toBeGreaterThan(0);
          delete res.body.nfts[i].onsaleUntil;
        }
      }

      expect(res.body).toStrictEqual({
        currentPage: 1,
        numberOfPages: 1,
        totalNftCount: 9,
        nfts: [
          {
            id: 1,
            name: 'Cartoon',
            description:
              'Hey guys, here s the WL team ready to write some more code !',
            ipfsHash: null,
            artifactUri:
              'https://images.unsplash.com/photo-1603344204980-4edb0ea63148?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8ZHJhd2luZ3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=900&q=60',
            displayUri:
              'https://images.unsplash.com/photo-1603344204980-4edb0ea63148?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8ZHJhd2luZ3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=900&q=60',
            thumbnailUri:
              'https://images.unsplash.com/photo-1603344204980-4edb0ea63148?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8ZHJhd2luZ3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=900&q=60',
            price: '0.10',
            editionsSize: 4,
            editionsAvailable: 4,
            categories: [
              {
                description: 'Sub fine art category',
                id: 4,
                name: 'Drawing',
              },
            ],
          },
          {
            id: 2,
            name: 'Framley',
            description:
              'Framley Parsonage - Was it not a Lie?,1860. John Everett Millais (d.1896) and Dalziel Brothers',
            ipfsHash: null,
            artifactUri:
              'https://images.unsplash.com/photo-1582201942988-13e60e4556ee?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2202&q=80',
            displayUri:
              'https://images.unsplash.com/photo-1582201942988-13e60e4556ee?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2202&q=80',
            thumbnailUri:
              'https://images.unsplash.com/photo-1582201942988-13e60e4556ee?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2202&q=80',
            price: '7.80',
            editionsSize: 2,
            editionsAvailable: 2,
            categories: [
              {
                description: 'Sub fine art category',
                id: 4,
                name: 'Drawing',
              },
            ],
          },
          {
            id: 3,
            name: 'Internet',
            description: 'its a mountain',
            ipfsHash: null,
            artifactUri:
              'https://images.unsplash.com/photo-1585007600263-71228e40c8d1?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=3870&q=80',
            displayUri:
              'https://images.unsplash.com/photo-1585007600263-71228e40c8d1?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=3870&q=80',
            thumbnailUri:
              'https://images.unsplash.com/photo-1585007600263-71228e40c8d1?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=3870&q=80',
            price: '10.40',
            editionsSize: 6,
            editionsAvailable: 6,
            categories: [
              {
                description: 'Sub fine art category',
                id: 4,
                name: 'Drawing',
              },
            ],
          },
          {
            id: 4,
            name: 'The cat & the city',
            description: 'What s better then a cat in a city ?',
            ipfsHash: null,
            artifactUri:
              'https://images.unsplash.com/photo-1615639164213-aab04da93c7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1974&q=80',
            displayUri:
              'https://images.unsplash.com/photo-1615639164213-aab04da93c7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1974&q=80',
            thumbnailUri:
              'https://images.unsplash.com/photo-1615639164213-aab04da93c7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1974&q=80',
            price: '4.30',
            editionsSize: 8,
            editionsAvailable: 8,
            categories: [
              {
                description: 'Sub fine art category',
                id: 4,
                name: 'Drawing',
              },
            ],
          },
          {
            id: 10,
            name: 'Antonin DVORAK',
            description:
              'Bronze sculpture of Antonin DVORAK who lived from 1841 - 1904',
            ipfsHash: null,
            artifactUri:
              'https://images.unsplash.com/photo-1638186824584-6d6367254927?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHx0b3BpYy1mZWVkfDJ8YkRvNDhjVWh3bll8fGVufDB8fHx8&auto=format&fit=crop&w=900&q=60',
            displayUri:
              'https://images.unsplash.com/photo-1638186824584-6d6367254927?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHx0b3BpYy1mZWVkfDJ8YkRvNDhjVWh3bll8fGVufDB8fHx8&auto=format&fit=crop&w=900&q=60',
            thumbnailUri:
              'https://images.unsplash.com/photo-1638186824584-6d6367254927?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHx0b3BpYy1mZWVkfDJ8YkRvNDhjVWh3bll8fGVufDB8fHx8&auto=format&fit=crop&w=900&q=60',
            price: '9.20',
            editionsSize: 8,
            editionsAvailable: 8,
            categories: [
              {
                description: 'Sub fine art category',
                id: 6,
                name: 'Sculpture',
              },
            ],
          },
          {
            id: 11,
            name: 'Korean Language',
            description:
              'Inventor of the korean language. This is the statue in Seoul South Korea of him.',
            ipfsHash: null,
            artifactUri:
              'https://images.unsplash.com/photo-1506809211073-d0785aaad75e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2656&q=80',
            displayUri:
              'https://images.unsplash.com/photo-1506809211073-d0785aaad75e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2656&q=80',
            thumbnailUri:
              'https://images.unsplash.com/photo-1506809211073-d0785aaad75e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2656&q=80',
            price: '4.10',
            editionsSize: 8,
            editionsAvailable: 8,
            categories: [
              {
                description: 'Sub fine art category',
                id: 6,
                name: 'Sculpture',
              },
            ],
          },
          {
            id: 12,
            name: 'TOCABI',
            description:
              'The humanoid robot TOCABI. I both led the design and took the photo. It is a full-size (real) humanoid robot that can also be used as an avatar for teleoperation.',
            ipfsHash: null,
            artifactUri:
              'https://images.unsplash.com/photo-1633957897986-70e83293f3ff?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1986&q=80',
            displayUri:
              'https://images.unsplash.com/photo-1633957897986-70e83293f3ff?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1986&q=80',
            thumbnailUri:
              'https://images.unsplash.com/photo-1633957897986-70e83293f3ff?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1986&q=80',
            price: '3.60',
            editionsSize: 8,
            editionsAvailable: 8,
            categories: [
              {
                description: 'Sub fine art category',
                id: 6,
                name: 'Sculpture',
              },
            ],
          },
          {
            id: 13,
            name: 'Lost',
            description: 'You look lost in thought.',
            ipfsHash: null,
            artifactUri:
              'https://images.unsplash.com/photo-1599790772272-d1425cd3242e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1yZWxhdGVkfDV8fHxlbnwwfHx8fA%3D%3D&auto=format&fit=crop&w=900&q=60',
            displayUri:
              'https://images.unsplash.com/photo-1599790772272-d1425cd3242e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1yZWxhdGVkfDV8fHxlbnwwfHx8fA%3D%3D&auto=format&fit=crop&w=900&q=60',
            thumbnailUri:
              'https://images.unsplash.com/photo-1599790772272-d1425cd3242e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1yZWxhdGVkfDV8fHxlbnwwfHx8fA%3D%3D&auto=format&fit=crop&w=900&q=60',
            price: '64.20',
            editionsSize: 8,
            editionsAvailable: 8,
            categories: [
              {
                description: 'Sub fine art category',
                id: 6,
                name: 'Sculpture',
              },
            ],
          },
          {
            id: 14,
            name: 'Light Festival - Korea',
            description:
              'In South Korea these sculptures are part of the light festival. Dragon vs. Tiger.',
            ipfsHash: null,
            artifactUri:
              'https://images.unsplash.com/photo-1508454868649-abc39873d8bf?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=3870&q=80',
            displayUri:
              'https://images.unsplash.com/photo-1508454868649-abc39873d8bf?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=3870&q=80',
            thumbnailUri:
              'https://images.unsplash.com/photo-1508454868649-abc39873d8bf?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=3870&q=80',
            price: '343.20',
            editionsSize: 8,
            editionsAvailable: 8,
            categories: [
              {
                description: 'Sub fine art category',
                id: 6,
                name: 'Sculpture',
              },
            ],
          },
        ],
        lowerPriceBound: '0.10',
        upperPriceBound: '343.20',
      });
    },
  );

  skipOnPriorFail(
    '/nfts with categories AND address filter (all of /nfts filters are AND, nft must belong to at least one of the requested categories AND be owned at least once by requested address)',
    async () => {
      const res = await request(app.getHttpServer())
        .get('/nfts')
        .query({ categories: '4,6', userAddress: 'addr' });
      expect(res.statusCode).toEqual(200);

      for (const i in res.body.nfts) {
        expect(res.body.nfts[i].createdAt).toBeGreaterThan(0);
        expect(res.body.nfts[i].launchAt).toBeGreaterThan(0);
        delete res.body.nfts[i].createdAt;
        delete res.body.nfts[i].launchAt;

        if (typeof res.body.nfts[i].onsaleUntil !== 'undefined') {
          expect(res.body.nfts[i].onsaleUntil).toBeGreaterThan(0);
          delete res.body.nfts[i].onsaleUntil;
        }
      }

      expect(res.body).toStrictEqual({
        currentPage: 1,
        numberOfPages: 0,
        totalNftCount: 0,
        nfts: [],
        lowerPriceBound: '0.00',
        upperPriceBound: '0.00',
      });
    },
  );

  skipOnPriorFail('/nfts with upcoming filter', async () => {
    const res = await request(app.getHttpServer())
      .get('/nfts')
      .query({ availability: 'upcoming' });
    expect(res.statusCode).toEqual(200);

    for (const i in res.body.nfts) {
      expect(res.body.nfts[i].createdAt).toBeGreaterThan(0);
      expect(res.body.nfts[i].launchAt).toBeGreaterThan(0);
      delete res.body.nfts[i].createdAt;
      delete res.body.nfts[i].launchAt;

      if (typeof res.body.nfts[i].onsaleUntil !== 'undefined') {
        expect(res.body.nfts[i].onsaleUntil).toBeGreaterThan(0);
        delete res.body.nfts[i].onsaleUntil;
      }
    }

    expect(res.body).toStrictEqual({
      currentPage: 1,
      lowerPriceBound: '10.40',
      nfts: [
        {
          artifactUri:
            'https://images.unsplash.com/photo-1585007600263-71228e40c8d1?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=3870&q=80',
          categories: [
            {
              description: 'Sub fine art category',
              id: 4,
              name: 'Drawing',
            },
          ],
          description: 'its a mountain',
          displayUri:
            'https://images.unsplash.com/photo-1585007600263-71228e40c8d1?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=3870&q=80',
          editionsAvailable: 6,
          editionsSize: 6,
          id: 3,
          ipfsHash: null,
          name: 'Internet',
          price: '10.40',
          thumbnailUri:
            'https://images.unsplash.com/photo-1585007600263-71228e40c8d1?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=3870&q=80',
        },
      ],
      numberOfPages: 1,
      totalNftCount: 1,
      upperPriceBound: '10.40',
    });
  });

  skipOnPriorFail('/nfts with endingSoon filter', async () => {
    const res = await request(app.getHttpServer())
      .get('/nfts')
      .query({ availability: 'endingSoon' });
    expect(res.statusCode).toEqual(200);

    for (const i in res.body.nfts) {
      expect(res.body.nfts[i].createdAt).toBeGreaterThan(0);
      expect(res.body.nfts[i].launchAt).toBeGreaterThan(0);
      delete res.body.nfts[i].createdAt;
      delete res.body.nfts[i].launchAt;

      if (typeof res.body.nfts[i].onsaleUntil !== 'undefined') {
        expect(res.body.nfts[i].onsaleUntil).toBeGreaterThan(0);
        delete res.body.nfts[i].onsaleUntil;
      }
    }

    expect(res.body).toStrictEqual({
      currentPage: 1,
      numberOfPages: 1,
      nfts: [
        {
          id: 1,
          name: 'Cartoon',
          description:
            'Hey guys, here s the WL team ready to write some more code !',
          ipfsHash: null,
          artifactUri:
            'https://images.unsplash.com/photo-1603344204980-4edb0ea63148?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8ZHJhd2luZ3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=900&q=60',
          displayUri:
            'https://images.unsplash.com/photo-1603344204980-4edb0ea63148?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8ZHJhd2luZ3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=900&q=60',
          thumbnailUri:
            'https://images.unsplash.com/photo-1603344204980-4edb0ea63148?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8ZHJhd2luZ3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=900&q=60',
          price: '0.10',
          editionsSize: 4,
          editionsAvailable: 4,
          categories: [
            {
              description: 'Sub fine art category',
              id: 4,
              name: 'Drawing',
            },
          ],
        },
      ],
      lowerPriceBound: '0.10',
      upperPriceBound: '0.10',
      totalNftCount: 1,
    });
  });

  skipOnPriorFail(
    '/nfts with 2 availability filters is a union (not intersection)',
    async () => {
      const res = await request(app.getHttpServer())
        .get('/nfts')
        .query({ availability: 'upcoming,endingSoon' });
      expect(res.statusCode).toEqual(200);

      for (const i in res.body.nfts) {
        expect(res.body.nfts[i].createdAt).toBeGreaterThan(0);
        expect(res.body.nfts[i].launchAt).toBeGreaterThan(0);
        delete res.body.nfts[i].createdAt;
        delete res.body.nfts[i].launchAt;

        if (typeof res.body.nfts[i].onsaleUntil !== 'undefined') {
          expect(res.body.nfts[i].onsaleUntil).toBeGreaterThan(0);
          delete res.body.nfts[i].onsaleUntil;
        }
      }

      expect(res.body).toStrictEqual({
        currentPage: 1,
        lowerPriceBound: '0.10',
        nfts: [
          {
            id: 1,
            name: 'Cartoon',
            description:
              'Hey guys, here s the WL team ready to write some more code !',
            ipfsHash: null,
            artifactUri:
              'https://images.unsplash.com/photo-1603344204980-4edb0ea63148?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8ZHJhd2luZ3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=900&q=60',
            displayUri:
              'https://images.unsplash.com/photo-1603344204980-4edb0ea63148?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8ZHJhd2luZ3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=900&q=60',
            thumbnailUri:
              'https://images.unsplash.com/photo-1603344204980-4edb0ea63148?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8ZHJhd2luZ3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=900&q=60',
            price: '0.10',
            editionsSize: 4,
            editionsAvailable: 4,
            categories: [
              {
                description: 'Sub fine art category',
                id: 4,
                name: 'Drawing',
              },
            ],
          },
          {
            artifactUri:
              'https://images.unsplash.com/photo-1585007600263-71228e40c8d1?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=3870&q=80',
            categories: [
              {
                description: 'Sub fine art category',
                id: 4,
                name: 'Drawing',
              },
            ],
            description: 'its a mountain',
            displayUri:
              'https://images.unsplash.com/photo-1585007600263-71228e40c8d1?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=3870&q=80',
            editionsAvailable: 6,
            editionsSize: 6,
            id: 3,
            ipfsHash: null,
            name: 'Internet',
            price: '10.40',
            thumbnailUri:
              'https://images.unsplash.com/photo-1585007600263-71228e40c8d1?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=3870&q=80',
          },
        ],
        numberOfPages: 1,
        totalNftCount: 2,
        upperPriceBound: '10.40',
      });
    },
  );

  skipOnPriorFail('/nfts pagination', async () => {
    const PAGE_SIZE = 3;
    const res = await request(app.getHttpServer())
      .get('/nfts')
      .query({ page: '3', pageSize: `${PAGE_SIZE}` });
    expect(res.statusCode).toEqual(200);

    expect(res.body.nfts.length).toEqual(PAGE_SIZE);

    expect(res.body.nfts.map((elem: any) => elem.id)).toStrictEqual([7, 8, 9]);
  });

  skipOnPriorFail('/nfts pagination (page <1 => BAD REQUEST)', async () => {
    let res = await request(app.getHttpServer())
      .get('/nfts')
      .query({ page: '0' });
    expect(res.statusCode).toEqual(400);

    res = await request(app.getHttpServer()).get('/nfts').query({ page: -1 });
    expect(res.statusCode).toEqual(400);
  });

  skipOnPriorFail('/nfts pagination (pageSize <1 => BAD REQUEST)', async () => {
    let res = await request(app.getHttpServer())
      .get('/nfts')
      .query({ pageSize: '0' });
    expect(res.statusCode).toEqual(400);

    res = await request(app.getHttpServer())
      .get('/nfts')
      .query({ pageSize: '-1' });
    expect(res.statusCode).toEqual(400);
  });

  skipOnPriorFail(
    '/nfts non number params that should be a number => BAD REQUEST',
    async () => {
      let res = await request(app.getHttpServer())
        .get('/nfts')
        .query({ categories: '4,not_a_number,8,10' });
      expect(res.statusCode).toEqual(400);

      res = await request(app.getHttpServer())
        .get('/nfts')
        .query({ page: 'not_a_number' });
      expect(res.statusCode).toEqual(400);

      res = await request(app.getHttpServer())
        .get('/nfts')
        .query({ pageSize: 'not_a_number' });
      expect(res.statusCode).toEqual(400);
    },
  );

  skipOnPriorFail(
    '/nfts invalid orderBy or orderDirection => BAD REQUEST',
    async () => {
      let res = await request(app.getHttpServer())
        .get('/nfts')
        .query({ orderBy: 'notavalidorderBy' });
      expect(res.statusCode).toEqual(400);

      res = await request(app.getHttpServer())
        .get('/nfts')
        .query({ orderDirection: `asc; select 'maliciousness'` });
      expect(res.statusCode).toEqual(400);
    },
  );

  skipOnPriorFail('/nfts/search', async () => {
    const res = await request(app.getHttpServer())
      .get('/nfts/search')
      .query({ searchString: 'honk kong festival' });
    expect(res.statusCode).toEqual(200);

    for (const i in res.body.nfts) {
      expect(res.body.nfts[i].createdAt).toBeGreaterThan(0);
      expect(res.body.nfts[i].launchAt).toBeGreaterThan(0);
      delete res.body.nfts[i].createdAt;
      delete res.body.nfts[i].launchAt;

      if (typeof res.body.nfts[i].onsaleUntil !== 'undefined') {
        expect(res.body.nfts[i].onsaleUntil).toBeGreaterThan(0);
        delete res.body.nfts[i].onsaleUntil;
      }
    }

    expect(res.body).toStrictEqual({
      nfts: [
        {
          id: 14,
          name: 'Light Festival - Korea',
          description:
            'In South Korea these sculptures are part of the light festival. Dragon vs. Tiger.',
          ipfsHash: null,
          artifactUri:
            'https://images.unsplash.com/photo-1508454868649-abc39873d8bf?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=3870&q=80',
          displayUri:
            'https://images.unsplash.com/photo-1508454868649-abc39873d8bf?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=3870&q=80',
          thumbnailUri:
            'https://images.unsplash.com/photo-1508454868649-abc39873d8bf?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=3870&q=80',
          price: '343.20',
          editionsSize: 8,
          editionsAvailable: 8,
          categories: [
            {
              description: 'Sub fine art category',
              id: 6,
              name: 'Sculpture',
            },
          ],
        },
      ],
      categories: [
        { id: 13, name: 'Honk Kong', description: 'Sub cities category' },
      ],
    });
  });

  skipOnPriorFail(
    '/nfts/search (empty searchString gives most popular categories, based on POST /nfts/:id hits)',
    async () => {
      const res = await request(app.getHttpServer())
        .get('/nfts/search')
        .query({ searchString: '' });
      expect(res.statusCode).toEqual(200);

      expect(res.body).toStrictEqual({
        nfts: [],
        categories: [
          { id: 13, name: 'Honk Kong', description: 'Sub cities category' },
          {
            id: 16,
            name: 'Black & White',
            description: 'Sub photography category',
          },
          {
            id: 10,
            name: 'Landscape',
            description: 'Sub photography category',
          },
          { id: 15, name: 'London', description: 'Sub cities category' },
          {
            id: 9,
            name: 'Abstract',
            description: 'Sub photography category',
          },
          { id: 4, name: 'Drawing', description: 'Sub fine art category' },
        ],
      });
    },
  );

  skipOnPriorFail(
    '/nfts/search (omitting searchString => BAD REQUEST)',
    async () => {
      const res = await request(app.getHttpServer()).get('/nfts/search');
      expect(res.statusCode).toEqual(400);
    },
  );

  skipOnPriorFail('/auth/register', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ userAddress: 'someaddr', signedPayload: 'verysecret' });
    expect(res.statusCode).toEqual(201);
  });

  skipOnPriorFail('/auth/register (existing addr => FORBIDDEN', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ userAddress: 'someaddr', signedPayload: '...' });
    expect(res.statusCode).toEqual(403);
  });

  skipOnPriorFail(
    '/auth/login trying to log in for non-existing account addr => BAD REQUEST',
    async () => {
      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          userAddress: 'this address doesnt exist',
          signedPayload: '...',
        });
      expect(login.statusCode).toEqual(400);
    },
  );

  skipOnPriorFail(
    '/auth/login trying to log in for existing account addr with bad pass => BAD REQUEST',
    async () => {
      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          userAddress: 'addr',
          signedPayload: 'bad password',
        });
      expect(login.statusCode).toEqual(401);
    },
  );

  skipOnPriorFail(
    '/users/topBuyers when no one has bought anything yet',
    async () => {
      const res = await request(app.getHttpServer()).get('/users/topBuyers');
      expect(res.statusCode).toEqual(200);

      expect(res.body).toStrictEqual({
        topBuyers: [],
      });
    },
  );

  skipOnPriorFail(
    '/users/profile: not logged in and no userAddress provided => BAD REQUEST',
    async () => {
      const res = await request(app.getHttpServer()).get('/users/profile');
      expect(res.statusCode).toEqual(400);
    },
  );

  skipOnPriorFail(
    '/users/profile: non existing userAddress provided => BAD REQUEST',
    async () => {
      const res = await request(app.getHttpServer())
        .get('/users/profile')
        .query({ userAddress: 'nonsense address' });
      expect(res.statusCode).toEqual(400);
    },
  );

  skipOnPriorFail(
    '/users/profile: existing userAddress provided => OK',
    async () => {
      const res = await request(app.getHttpServer())
        .get('/users/profile')
        .query({ userAddress: 'addr' });
      expect(res.statusCode).toEqual(200);

      // cannot test this accurately because currently the testdb is populated
      // with now() timestamps
      expect(res.body.user?.createdAt).toBeGreaterThan(0);
      delete res.body.user?.createdAt;

      expect(res.body).toStrictEqual({
        collection: {
          currentPage: 1,
          lowerPriceBound: '0.00',
          nfts: [],
          numberOfPages: 0,
          totalNftCount: 0,
          upperPriceBound: '0.00',
        },
        pendingOwnership: [],
        user: {
          id: 1,
          userAddress: 'addr',
          profilePicture: null,
        },
      });
    },
  );

  skipOnPriorFail(
    '/users/profile: no userAddress provided and logged in => OK, return profile of logged in user',
    async () => {
      const { bearer } = await loginUser(app, 'addr', 'admin');

      const res = await request(app.getHttpServer())
        .get('/users/profile')
        .set('authorization', bearer);
      expect(res.statusCode).toEqual(200);

      // cannot test this accurately because currently the testdb is populated
      // with now() timestamps
      expect(res.body.user?.createdAt).toBeGreaterThan(0);
      delete res.body.user?.createdAt;

      expect(res.body).toStrictEqual({
        collection: {
          currentPage: 1,
          lowerPriceBound: '0.00',
          nfts: [],
          numberOfPages: 0,
          totalNftCount: 0,
          upperPriceBound: '0.00',
        },
        pendingOwnership: [],
        user: {
          id: 1,
          userAddress: 'addr',
          profilePicture: null,
        },
      });
    },
  );

  skipOnPriorFail(
    '/users/profile: userAddress provided and logged in => OK, return profile of provided userAddress',
    async () => {
      const { bearer } = await loginUser(app, 'addr', 'admin');

      const res = await request(app.getHttpServer())
        .get('/users/profile')
        .set('authorization', bearer)
        .query({ userAddress: 'tz1' });
      expect(res.statusCode).toEqual(200);

      // cannot test this accurately because currently the testdb is populated
      // with now() timestamps
      expect(res.body.user?.createdAt).toBeGreaterThan(0);
      delete res.body.user?.createdAt;

      expect(res.body).toStrictEqual({
        collection: {
          currentPage: 1,
          lowerPriceBound: '0.00',
          nfts: [],
          numberOfPages: 0,
          totalNftCount: 0,
          upperPriceBound: '0.00',
        },
        pendingOwnership: [],
        user: {
          id: 2,
          userAddress: 'tz1',
          profilePicture: null,
        },
      });
    },
  );

  skipOnPriorFail(
    '/users/cart (cookie based), list lists in order of add (part 1)',
    async () => {
      const add1 = await request(app.getHttpServer()).post('/users/cart/add/4');
      expect(add1.statusCode).toEqual(201);

      const cookie = add1.headers['set-cookie'];

      const add2 = await request(app.getHttpServer())
        .post('/users/cart/add/12')
        .set('cookie', cookie);
      expect(add2.statusCode).toEqual(201);

      const list = await request(app.getHttpServer())
        .post('/users/cart/list')
        .set('cookie', cookie);
      expect(list.statusCode).toEqual(201);

      const idList = list.body.nfts.map((nft: any) => nft.id);
      expect(idList).toEqual([4, 12]);
    },
  );

  skipOnPriorFail(
    '/users/cart (cookie based), list lists in order of id (part 2)',
    async () => {
      const add1 = await request(app.getHttpServer()).post(
        '/users/cart/add/12',
      );
      expect(add1.statusCode).toEqual(201);

      const cookie = add1.headers['set-cookie'];

      const add2 = await request(app.getHttpServer())
        .post('/users/cart/add/4')
        .set('cookie', cookie);
      expect(add2.statusCode).toEqual(201);

      // double add of same nft => BAD REQUEST. can only have 1 edition per nft per cart session
      const add2Part2 = await request(app.getHttpServer())
        .post('/users/cart/add/4')
        .set('cookie', cookie);
      expect(add2Part2.statusCode).toEqual(400);

      const list = await request(app.getHttpServer())
        .post('/users/cart/list')
        .set('cookie', cookie);
      expect(list.statusCode).toEqual(201);

      // trigger deletion manually, because waiting for the CRON can take 60 seconds - too long for a test
      // note: this is just here to verify that _nothing_ gets deleted, because
      // in this test nothing should have expired
      await userService.deleteExpiredCarts();

      const idList = list.body.nfts.map((nft: any) => nft.id);
      expect(idList).toEqual([4, 12]);
    },
  );

  skipOnPriorFail(
    '/users/cart verify expiration (by setting very small expiration timeout)',
    async () => {
      await app.close();

      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();
      app = moduleFixture.createNestApplication();
      app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
      app.enableShutdownHooks();
      await app.init();

      const userService = await moduleFixture.get(UserService);

      userService.CART_EXPIRATION_MILLI_SECS = 0;
      userService.CART_EXPIRATION_AT_MINUTE_END = false;
      const add1 = await request(app.getHttpServer()).post(
        '/users/cart/add/12',
      );
      expect(add1.statusCode).toEqual(201);

      // trigger deletion manually, because waiting for the CRON can take 60 seconds - too long for a test
      await userService.deleteExpiredCarts();

      const cookie = add1.headers['set-cookie'];
      const list = await request(app.getHttpServer())
        .post('/users/cart/list')
        .set('cookie', cookie);
      expect(list.statusCode).toEqual(201);

      const idList = list.body.nfts.map((nft: any) => nft.id);
      expect(idList).toEqual([]);
    },
  );

  skipOnPriorFail(
    '/users/cart (cookie based to login and logout interactions)',
    async () => {
      const add1 = await request(app.getHttpServer()).post('/users/cart/add/4');
      expect(add1.statusCode).toEqual(201);

      const cookie = add1.headers['set-cookie'];

      const add2 = await request(app.getHttpServer())
        .post('/users/cart/add/12')
        .set('cookie', cookie);
      expect(add2.statusCode).toEqual(201);

      let list = await request(app.getHttpServer())
        .post('/users/cart/list')
        .set('cookie', cookie);
      expect(list.statusCode).toEqual(201);

      let idList = list.body.nfts.map((nft: any) => nft.id);
      expect(idList).toEqual([4, 12]);

      // now login. this should takeover the cart session of the cookie
      const { bearer } = await loginUser(app, 'addr', 'admin');
      const listLoggedIn = await request(app.getHttpServer())
        .post('/users/cart/list')
        .set('cookie', cookie)
        .set('authorization', bearer);
      expect(listLoggedIn.statusCode).toEqual(201);

      const idListLoggedIn = list.body.nfts.map((nft: any) => nft.id);
      expect(idListLoggedIn).toEqual(idList);

      const remove = await request(app.getHttpServer())
        .post('/users/cart/remove/4')
        .set('cookie', cookie)
        .set('authorization', bearer);
      expect(remove.statusCode).toEqual(204);

      list = await request(app.getHttpServer())
        .post('/users/cart/list')
        .set('cookie', cookie)
        .set('authorization', bearer);
      expect(list.statusCode).toEqual(201);

      idList = list.body.nfts.map((nft: any) => nft.id);
      expect(idList).toEqual([12]);

      // now logout, this should generate a new cookie session, giving a new cart
      // that is not attached to the logged in session
      const logout = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('cookie', cookie)
        .set('authorization', bearer);

      expect(logout.statusCode).toEqual(201);

      const newCookie = logout.headers['set-cookie'];
      expect(newCookie).not.toEqual(cookie);

      list = await request(app.getHttpServer())
        .post('/users/cart/list')
        .set('cookie', newCookie);
      expect(list.statusCode).toEqual(201);

      idList = list.body.nfts.map((nft: any) => nft.id);
      expect(idList).toEqual([]);

      // now logging back in, gives back the session we had
      const newBearer = await loginUser(app, 'addr', 'admin');
      list = await request(app.getHttpServer())
        .post('/users/cart/list')
        .set('cookie', newCookie)
        .set('authorization', newBearer.bearer);
      expect(list.statusCode).toEqual(201);

      idList = list.body.nfts.map((nft: any) => nft.id);
      expect(idList).toEqual([12]);

      // test cleanup
      await request(app.getHttpServer())
        .post('/users/cart/remove/12')
        .set('cookie', cookie)
        .set('authorization', newBearer.bearer);
    },
  );

  skipOnPriorFail(
    '/users/cart (empty cookie based into login does *not* take over user session)',
    async () => {
      const { bearer } = await loginUser(app, 'addr', 'admin');

      const add1 = await request(app.getHttpServer())
        .post('/users/cart/add/4')
        .set('authorization', bearer);
      expect(add1.statusCode).toEqual(201);
      const cookie = add1.headers['set-cookie'];

      const logout = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('cookie', cookie)
        .set('authorization', bearer);
      expect(logout.statusCode).toEqual(201);

      // Should not receive a new cookie, previous cookie is not
      // used and can be reused
      expect(logout.headers['set-cookie']).toBe(undefined);

      const add2 = await request(app.getHttpServer())
        .post('/users/cart/add/10')
        .set('cookie', cookie);
      expect(add2.statusCode).toEqual(201);

      await request(app.getHttpServer())
        .post('/users/cart/remove/10')
        .set('cookie', cookie);

      // now logging back in, gives back the session we had,
      // because the newCookie cart is empty
      const newBearer = await loginUser(app, 'addr', 'admin');
      const list = await request(app.getHttpServer())
        .post('/users/cart/list')
        .set('cookie', cookie)
        .set('authorization', newBearer.bearer);
      expect(list.statusCode).toEqual(201);

      const idList = list.body.nfts.map((nft: any) => nft.id);
      expect(idList).toEqual([4]);

      // test cleanup
      await request(app.getHttpServer())
        .post('/users/cart/remove/4')
        .set('cookie', cookie)
        .set('authorization', newBearer.bearer);
    },
  );

  skipOnPriorFail(
    '/users/cart (non-empty cookie based into login does take over user session)',
    async () => {
      const { bearer } = await loginUser(app, 'addr', 'admin');

      const add1 = await request(app.getHttpServer())
        .post('/users/cart/add/4')
        .set('authorization', bearer);
      expect(add1.statusCode).toEqual(201);
      const cookie = add1.headers['set-cookie'];

      const logout = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('cookie', cookie)
        .set('authorization', bearer);
      expect(logout.statusCode).toEqual(201);

      // Should not receive a new cookie, previous cookie is not used and can
      // be reused
      expect(logout.headers['set-cookie']).toBe(undefined);

      const add2 = await request(app.getHttpServer())
        .post('/users/cart/add/10')
        .set('cookie', cookie);
      expect(add2.statusCode).toEqual(201);

      // now logging back in, user session is replaced with newCookie session
      const newBearer = await loginUser(app, 'addr', 'admin');
      const list = await request(app.getHttpServer())
        .post('/users/cart/list')
        .set('cookie', cookie)
        .set('authorization', newBearer.bearer);
      expect(list.statusCode).toEqual(201);

      const idList = list.body.nfts.map((nft: any) => nft.id);
      expect(idList).toEqual([10]);

      // test cleanup
      await request(app.getHttpServer())
        .post('/users/cart/remove/10')
        .set('cookie', cookie)
        .set('authorization', newBearer.bearer);
    },
  );

  skipOnPriorFail('/users/cart (BAD REQUEST on duplicate add)', async () => {
    const add1 = await request(app.getHttpServer()).post('/users/cart/add/4');
    expect(add1.statusCode).toEqual(201);
    const cookie = add1.headers['set-cookie'];

    const add2 = await request(app.getHttpServer())
      .post('/users/cart/add/4')
      .set('cookie', cookie);
    expect(add2.statusCode).toEqual(400);
  });

  skipOnPriorFail(
    '/users/cart (BAD REQUEST on remove of item not in cart)',
    async () => {
      const add1 = await request(app.getHttpServer()).post('/users/cart/add/4');
      expect(add1.statusCode).toEqual(201);
      const cookie = add1.headers['set-cookie'];

      const remove = await request(app.getHttpServer())
        .post('/users/cart/remove/5')
        .set('cookie', cookie);
      expect(remove.statusCode).toEqual(400);
    },
  );

  skipOnPriorFail(
    'Rate limiter test (requesting 1 more time than is allowed, should result in exactly 1 429)',
    async () => {
      const server = app.getHttpServer();
      const respPromises = [];
      for (let i = 0; i < RATE_LIMIT + 1; i++) {
        respPromises.push(request(server).post('/nfts/0'));
      }
      const resp = await Promise.all(respPromises);
      expect(
        resp.filter((resp: any) => resp.statusCode === 429).length,
      ).toEqual(1);
    },
  );

  const getLockedCount = async (nftId: number) => {
    const resp = await request(app.getHttpServer()).post(`/nfts/${nftId}`);
    return resp.body.editionsSize - resp.body.editionsAvailable;
  };

  skipOnPriorFail(
    'stripe payment: Payment status should change to succeeded if payment is successfull',
    async () => {
      const { bearer, id, address } = await loginUser(app, 'addr', 'admin');
      const usr = <UserEntity>{ userAddress: address, id: id };

      expect(await getLockedCount(1)).toEqual(0);

      const add1 = await request(app.getHttpServer())
        .post('/users/cart/add/4')
        .set('authorization', bearer);
      expect(add1.statusCode).toEqual(201);

      const add2 = await request(app.getHttpServer())
        .post('/users/cart/add/1')
        .set('authorization', bearer);
      expect(add2.statusCode).toEqual(201);

      // 1 edition reserved by the cart
      expect(await getLockedCount(1)).toEqual(1);

      // Create one payment intent (we are not calling the stripe api)
      const intentRes = await paymentService.createPayment(
        usr,
        PaymentProvider.TEST,
        'EUR',
      );

      // 1 edition reserved by the order
      expect(await getLockedCount(1)).toEqual(1);

      // Give webhook handler function success event
      const { paymentId } = await paymentService.getPaymentForLatestUserOrder(
        id,
      );

      // reconstruct success event from stripe
      const constructedEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: paymentId,
          },
        },
      };

      // Calling success status
      await paymentService.webhookHandler(constructedEvent);

      // 1 edition locked because it is now owned
      expect(await getLockedCount(1)).toEqual(1);

      // Check cart_session deleted
      const old_cart_session = await userService.getUserCartSession(id);
      expect(old_cart_session.val).toBeNull();

      // Check payment status changed to succeeded
      const { status } = await paymentService.getPaymentForLatestUserOrder(id);
      expect(status).toEqual(PaymentStatus.SUCCEEDED);

      // Check NFT ownership transfer
      const userNfts = await request(app.getHttpServer()).get(`/nfts`).query({
        userAddress: 'addr',
        orderDirection: 'asc',
        orderBy: 'id',
        page: 1,
        pageSize: 2,
      });

      expect(userNfts.statusCode).toEqual(200);

      const nftList = userNfts.body.nfts.map((nft: any) => nft.id);

      expect(nftList).toContain(4);
      expect(nftList).toContain(1);
    },
  );

  skipOnPriorFail(
    'stripe payment: Payment status should change to cancel if payment is canceled, nft should not be transferred',
    async () => {
      const { bearer, id, address } = await loginUser(app, 'addr', 'admin');
      const usr = <UserEntity>{ userAddress: address, id: id };

      expect(await getLockedCount(2)).toEqual(0);

      const add1 = await request(app.getHttpServer())
        .post('/users/cart/add/5')
        .set('authorization', bearer);
      expect(add1.statusCode).toEqual(201);

      const add2 = await request(app.getHttpServer())
        .post('/users/cart/add/2')
        .set('authorization', bearer);
      expect(add2.statusCode).toEqual(201);

      // 1 edition locked by cart (reservation)
      expect(await getLockedCount(2)).toEqual(1);

      // Create one payment intent (we are not calling the stripe api)
      await paymentService.createPayment(usr, PaymentProvider.TEST, 'EUR');

      // Give webhook handler function success event
      const { paymentId } = await paymentService.getPaymentForLatestUserOrder(
        id,
      );

      // 1 edition locked by order, cart is ignored (otherwise it'd lock 2 editions, not what we want)
      expect(await getLockedCount(2)).toEqual(1);

      // reconstruct success event from stripe
      const constructedEvent = {
        type: 'payment_intent.canceled',
        data: {
          object: {
            id: paymentId,
          },
        },
      };

      // Changing to canceled status
      await paymentService.webhookHandler(constructedEvent);

      // 1 edition still locked by cart (reservation)
      expect(await getLockedCount(2)).toEqual(1);

      // Check cart_session still here
      const old_cart_session = await userService.getUserCartSession(id);

      expect(old_cart_session.val).toBeDefined();
      expect(old_cart_session.ok).toEqual(true);

      // Check payment status changed to canceled
      const t = await paymentService.getPaymentForLatestUserOrder(id);

      expect(t.status).toEqual(PaymentStatus.CANCELED);

      const userNfts = await request(app.getHttpServer())
        // Check that NFT has not been transfered
        .get(`/nfts`)
        .query({
          userAddress: 'addr',
          orderDirection: 'asc',
          orderBy: 'id',
          page: 1,
          pageSize: 2,
        });
      expect(userNfts.statusCode).toEqual(200);

      const nftList = userNfts.body.nfts.map((nft: any) => nft.id);
      expect(nftList.indexOf(5)).toEqual(-1);
      expect(nftList.indexOf(2)).toEqual(-1);

      const remove1 = await request(app.getHttpServer())
        .post('/users/cart/remove/5')
        .set('authorization', bearer);
      expect(remove1.statusCode).toEqual(204);

      const remove2 = await request(app.getHttpServer())
        .post('/users/cart/remove/2')
        .set('authorization', bearer);
      expect(remove2.statusCode).toEqual(204);

      // 0 editions locked now that the cart is cleared too
      expect(await getLockedCount(2)).toEqual(0);
    },
  );

  skipOnPriorFail(
    'stripe payment: Payment status should change to failed if payment has failed, nft should not be transferred',
    async () => {
      const { bearer, id, address } = await loginUser(app, 'addr', 'admin');
      const usr = <UserEntity>{ userAddress: address, id: id };

      const add1 = await request(app.getHttpServer())
        .post('/users/cart/add/7')
        .set('authorization', bearer);
      expect(add1.statusCode).toEqual(201);

      const add2 = await request(app.getHttpServer())
        .post('/users/cart/add/6')
        .set('authorization', bearer);
      expect(add2.statusCode).toEqual(201);

      // Create one payment intent (we are not calling the stripe api)
      const preparedOrder = await paymentService.createPayment(
        usr,
        PaymentProvider.TEST,
        'EUR',
      );

      // Give webhook handler function success event
      const { paymentId } = await paymentService.getPaymentForLatestUserOrder(
        id,
      );

      // reconstruct success event from stripe
      const constructedEvent = {
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: paymentId,
          },
        },
      };

      // Calling fail status
      await paymentService.webhookHandler(constructedEvent);

      // Check cart_session deleted
      const old_cart_session = await userService.getUserCartSession(id);
      expect(old_cart_session.val).toBeDefined();
      expect(old_cart_session.ok).toEqual(true);

      // Check payment status changed to canceled
      const { status } = await paymentService.getPaymentForLatestUserOrder(id);
      expect(status).toEqual(PaymentStatus.FAILED);

      const userNfts = await request(app.getHttpServer())
        // Check that NFT has not been transfered
        .get(`/nfts`)
        .query({
          userAddress: 'addr',
          orderDirection: 'asc',
          orderBy: 'id',
          page: 1,
          pageSize: 2,
        });
      expect(userNfts.statusCode).toEqual(200);

      const nftList = userNfts.body.nfts.map((nft: any) => nft.id);
      expect(nftList.indexOf(7)).toEqual(-1);
      expect(nftList.indexOf(6)).toEqual(-1);

      const remove1 = await request(app.getHttpServer())
        .post('/users/cart/remove/7')
        .set('authorization', bearer);
      expect(remove1.statusCode).toEqual(204);

      const remove2 = await request(app.getHttpServer())
        .post('/users/cart/remove/6')
        .set('authorization', bearer);
      expect(remove2.statusCode).toEqual(204);
    },
  );

  skipOnPriorFail(
    'stripe payment: Payment status should change to timeout if payment has expired, and in CREATED OR PROMISED state',
    async () => {
      const { bearer, id, address } = await loginUser(app, 'addr', 'admin');
      const usr = <UserEntity>{ userAddress: address, id: id };

      const add1 = await request(app.getHttpServer())
        .post('/users/cart/add/4')
        .set('authorization', bearer);
      expect(add1.statusCode).toEqual(201);

      // Create one payment intent (we are not calling the stripe api)
      await paymentService.createPayment(usr, PaymentProvider.TEST, 'EUR');
      const { paymentId } = await paymentService.getPaymentForLatestUserOrder(
        usr.id,
      );
      // reconstruct success event from stripe
      const constructedEvent = {
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: paymentId,
          },
        },
      };
      await paymentService.webhookHandler(constructedEvent);
      // Check failed payment don't get to timeout
      const failed = await paymentService.getPaymentForLatestUserOrder(usr.id);
      expect(failed.status).toEqual(PaymentStatus.FAILED);
      // Check canceled payment don't get to timeout
      await paymentService.deleteExpiredPayments();
      const stillFailed = await paymentService.getPaymentForLatestUserOrder(
        usr.id,
      );
      expect(stillFailed.status).toEqual(PaymentStatus.FAILED);

      const preparedOrder2 = await paymentService.createPayment(
        usr,
        PaymentProvider.TEST,
        'EUR',
      );
      const payment3Data = await paymentService.getPaymentForLatestUserOrder(
        usr.id,
      );
      const constructedEvent3 = {
        type: 'payment_intent.canceled',
        data: {
          object: {
            id: payment3Data.paymentId,
          },
        },
      };
      await paymentService.webhookHandler(constructedEvent3);
      const canceled = await paymentService.getPaymentForLatestUserOrder(
        usr.id,
      );
      expect(canceled.status).toEqual(PaymentStatus.CANCELED);
      await paymentService.deleteExpiredPayments();
      const stillCanceled = await paymentService.getPaymentForLatestUserOrder(
        usr.id,
      );
      expect(stillCanceled.status).toEqual(PaymentStatus.CANCELED);

      await paymentService.createPayment(usr, PaymentProvider.TEST, 'EUR');
      const created = await paymentService.getPaymentForLatestUserOrder(usr.id);
      expect(created.status).toEqual(PaymentStatus.CREATED);
      await paymentService.deleteExpiredPayments();
      const timedOut = await paymentService.getPaymentForLatestUserOrder(
        usr.id,
      );
      expect(timedOut.status).toEqual(PaymentStatus.TIMED_OUT);

      await paymentService.createPayment(usr, PaymentProvider.TEST, 'EUR');
      const promisePaid = await paymentService.getPaymentForLatestUserOrder(
        usr.id,
      );
      const promisePaidPostResp = await request(app.getHttpServer())
        .post('/payment/promise-paid')
        .set('authorization', bearer)
        .send({ payment_id: promisePaid.paymentId });
      expect(promisePaidPostResp.statusCode).toEqual(201);
      const promised = await paymentService.getPaymentForLatestUserOrder(
        usr.id,
      );
      expect(promised.status).toEqual(PaymentStatus.PROMISED);
      await paymentService.deleteExpiredPayments();
      const promisedTimedOut =
        await paymentService.getPaymentForLatestUserOrder(usr.id);
      expect(promisedTimedOut.status).toEqual(PaymentStatus.TIMED_OUT);

      // need to re-add cart item, promise-paid drops the active cart session
      const readd = await request(app.getHttpServer())
        .post('/users/cart/add/4')
        .set('authorization', bearer);
      expect(readd.statusCode).toEqual(201);

      await await paymentService.createPayment(
        usr,
        PaymentProvider.TEST,
        'EUR',
      );
      const payment4Data = await paymentService.getPaymentForLatestUserOrder(
        usr.id,
      );
      // reconstruct success event from stripe
      const constructedEvent5 = {
        type: 'payment_intent.processing',
        data: {
          object: {
            id: payment4Data.paymentId,
          },
        },
      };
      await paymentService.webhookHandler(constructedEvent5);
      const processing = await paymentService.getPaymentForLatestUserOrder(
        usr.id,
      );
      expect(processing.status).toEqual(PaymentStatus.PROCESSING);
      await paymentService.deleteExpiredPayments();
      const processingDidNotTimeout =
        await paymentService.getPaymentForLatestUserOrder(usr.id);
      expect(processingDidNotTimeout.status).toEqual(PaymentStatus.PROCESSING);

      // need to re-add cart item, changing state to PROCESSING drops the active cart session
      const readd2 = await request(app.getHttpServer())
        .post('/users/cart/add/4')
        .set('authorization', bearer);
      expect(readd2.statusCode).toEqual(201);

      await paymentService.createPayment(usr, PaymentProvider.TEST, 'EUR');
      const payment5Data = await paymentService.getPaymentForLatestUserOrder(
        usr.id,
      );
      // reconstruct success event from stripe
      const constructedEvent2 = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: payment5Data.paymentId,
          },
        },
      };
      await paymentService.webhookHandler(constructedEvent2);
      const success = await paymentService.getPaymentForLatestUserOrder(usr.id);
      expect(success.status).toEqual(PaymentStatus.SUCCEEDED);
      await paymentService.deleteExpiredPayments();
      const stillSuccess = await paymentService.getPaymentForLatestUserOrder(
        usr.id,
      );
      expect(stillSuccess.status).toEqual(PaymentStatus.SUCCEEDED);
    },
  );

  skipOnPriorFail(
    'stripe payment: Payment status should not change from FAILED',
    async () => {
      const { bearer, id, address } = await loginUser(app, 'addr', 'admin');
      const usr = <UserEntity>{ userAddress: address, id: id };

      const add1 = await request(app.getHttpServer())
        .post('/users/cart/add/4')
        .set('authorization', bearer);
      expect(add1.statusCode).toEqual(201);

      await paymentService.createPayment(usr, PaymentProvider.TEST, 'EUR');

      // Give webhook handler function success event
      const { paymentId } = await paymentService.getPaymentForLatestUserOrder(
        id,
      );

      // reconstruct success event from stripe
      const constructedEvent = {
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: paymentId,
          },
        },
      };

      // Calling success status
      await paymentService.webhookHandler(constructedEvent);

      const failed = await paymentService.getPaymentForLatestUserOrder(id);
      expect(failed.status).toEqual(PaymentStatus.FAILED);

      // reconstruct success event from stripe
      const constructedEvent2 = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: failed.paymentId,
          },
        },
      };

      // Calling success status
      await paymentService.webhookHandler(constructedEvent2);

      const stillFailed = await paymentService.getPaymentForLatestUserOrder(id);
      expect(stillFailed.status).toEqual(PaymentStatus.FAILED);

      const cleanupCart = await request(app.getHttpServer())
        .post('/users/cart/remove/4')
        .set('authorization', bearer);
      expect(cleanupCart.statusCode).toEqual(204);
    },
  );

  skipOnPriorFail(
    'stripe payment: Payment status should not change from SUCCEEDED',
    async () => {
      const { bearer, id, address } = await loginUser(app, 'addr', 'admin');
      const usr = <UserEntity>{ userAddress: address, id: id };

      const add1 = await request(app.getHttpServer())
        .post('/users/cart/add/4')
        .set('authorization', bearer);
      expect(add1.statusCode).toEqual(201);

      await paymentService.createPayment(usr, PaymentProvider.TEST, 'EUR');

      // Give webhook handler function success event
      const { paymentId } = await paymentService.getPaymentForLatestUserOrder(
        id,
      );

      // reconstruct success event from stripe
      const constructedEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: paymentId,
          },
        },
      };

      // Calling success status
      await paymentService.webhookHandler(constructedEvent);

      const success = await paymentService.getPaymentForLatestUserOrder(id);
      expect(success.status).toEqual(PaymentStatus.SUCCEEDED);

      // reconstruct success event from stripe
      const constructedEvent2 = {
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: paymentId,
          },
        },
      };

      // Calling success status
      await paymentService.webhookHandler(constructedEvent2);

      const stillSuccess = await paymentService.getPaymentForLatestUserOrder(
        id,
      );
      expect(stillSuccess.status).toEqual(PaymentStatus.SUCCEEDED);
    },
  );

  skipOnPriorFail(
    '/nfts with address filter (OK when >0 nfts owned)',
    async () => {
      const res = await request(app.getHttpServer())
        .get('/nfts')
        .query({ userAddress: 'addr' });
      expect(res.statusCode).toEqual(200);

      for (const i in res.body.nfts) {
        expect(res.body.nfts[i].createdAt).toBeGreaterThan(0);
        expect(res.body.nfts[i].launchAt).toBeGreaterThan(0);
        delete res.body.nfts[i].createdAt;
        delete res.body.nfts[i].launchAt;

        if (typeof res.body.nfts[i].onsaleUntil !== 'undefined') {
          expect(res.body.nfts[i].onsaleUntil).toBeGreaterThan(0);
          delete res.body.nfts[i].onsaleUntil;
        }
      }

      expect(res.body).toStrictEqual({
        currentPage: 1,
        numberOfPages: 1,
        nfts: [
          {
            id: 1,
            name: 'Cartoon',
            description:
              'Hey guys, here s the WL team ready to write some more code !',
            ipfsHash: 'ipfs://.....', // Note: this is now non-null, because it's been purchased at least once
            artifactUri:
              'https://images.unsplash.com/photo-1603344204980-4edb0ea63148?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8ZHJhd2luZ3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=900&q=60',
            displayUri:
              'https://images.unsplash.com/photo-1603344204980-4edb0ea63148?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8ZHJhd2luZ3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=900&q=60',
            thumbnailUri:
              'https://images.unsplash.com/photo-1603344204980-4edb0ea63148?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8ZHJhd2luZ3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=900&q=60',
            price: '0.10',
            editionsSize: 4,
            editionsAvailable: 3,
            categories: [
              {
                id: 4,
                description: 'Sub fine art category',
                name: 'Drawing',
              },
            ],
          },
          {
            id: 4,
            name: 'The cat & the city',
            description: 'What s better then a cat in a city ?',
            ipfsHash: 'ipfs://.....', // Note: this is now non-null, because it's been purchased at least once
            artifactUri:
              'https://images.unsplash.com/photo-1615639164213-aab04da93c7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1974&q=80',
            displayUri:
              'https://images.unsplash.com/photo-1615639164213-aab04da93c7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1974&q=80',
            thumbnailUri:
              'https://images.unsplash.com/photo-1615639164213-aab04da93c7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1974&q=80',
            price: '4.30',
            editionsSize: 8,
            editionsAvailable: 0,
            categories: [
              {
                id: 4,
                description: 'Sub fine art category',
                name: 'Drawing',
              },
            ],
          },
        ],
        lowerPriceBound: '0.10',
        upperPriceBound: '4.30',
        totalNftCount: 2,
      });
    },
  );

  skipOnPriorFail(
    '/nfts with address filter (OK when >0 nfts owned, with pagination, page 1)',
    async () => {
      const res = await request(app.getHttpServer())
        .get('/nfts')
        .query({ userAddress: 'addr', pageSize: '1' });
      expect(res.statusCode).toEqual(200);

      for (const i in res.body.nfts) {
        expect(res.body.nfts[i].createdAt).toBeGreaterThan(0);
        expect(res.body.nfts[i].launchAt).toBeGreaterThan(0);
        delete res.body.nfts[i].createdAt;
        delete res.body.nfts[i].launchAt;

        if (typeof res.body.nfts[i].onsaleUntil !== 'undefined') {
          expect(res.body.nfts[i].onsaleUntil).toBeGreaterThan(0);
          delete res.body.nfts[i].onsaleUntil;
        }
      }

      expect(res.body).toStrictEqual({
        currentPage: 1,
        numberOfPages: 2,
        nfts: [
          {
            id: 1,
            name: 'Cartoon',
            description:
              'Hey guys, here s the WL team ready to write some more code !',
            ipfsHash: 'ipfs://.....',
            artifactUri:
              'https://images.unsplash.com/photo-1603344204980-4edb0ea63148?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8ZHJhd2luZ3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=900&q=60',
            displayUri:
              'https://images.unsplash.com/photo-1603344204980-4edb0ea63148?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8ZHJhd2luZ3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=900&q=60',
            thumbnailUri:
              'https://images.unsplash.com/photo-1603344204980-4edb0ea63148?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8ZHJhd2luZ3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=900&q=60',
            price: '0.10',
            editionsSize: 4,
            editionsAvailable: 3,
            categories: [
              {
                id: 4,
                description: 'Sub fine art category',
                name: 'Drawing',
              },
            ],
          },
        ],
        totalNftCount: 2,
        lowerPriceBound: '0.10',
        upperPriceBound: '4.30',
      });
    },
  );

  skipOnPriorFail(
    '/nfts with address filter (OK when >0 nfts owned, with pagination, page 2)',
    async () => {
      const res = await request(app.getHttpServer())
        .get('/nfts')
        .query({ userAddress: 'addr', pageSize: '1', page: '2' });
      expect(res.statusCode).toEqual(200);

      for (const i in res.body.nfts) {
        expect(res.body.nfts[i].createdAt).toBeGreaterThan(0);
        expect(res.body.nfts[i].launchAt).toBeGreaterThan(0);
        delete res.body.nfts[i].createdAt;
        delete res.body.nfts[i].launchAt;

        if (typeof res.body.nfts[i].onsaleUntil !== 'undefined') {
          expect(res.body.nfts[i].onsaleUntil).toBeGreaterThan(0);
          delete res.body.nfts[i].onsaleUntil;
        }
      }

      expect(res.body).toStrictEqual({
        currentPage: 2,
        numberOfPages: 2,
        nfts: [
          {
            id: 4,
            name: 'The cat & the city',
            description: 'What s better then a cat in a city ?',
            ipfsHash: 'ipfs://.....',
            artifactUri:
              'https://images.unsplash.com/photo-1615639164213-aab04da93c7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1974&q=80',
            displayUri:
              'https://images.unsplash.com/photo-1615639164213-aab04da93c7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1974&q=80',
            thumbnailUri:
              'https://images.unsplash.com/photo-1615639164213-aab04da93c7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1974&q=80',
            price: '4.30',
            editionsSize: 8,
            editionsAvailable: 0,
            categories: [
              {
                id: 4,
                description: 'Sub fine art category',
                name: 'Drawing',
              },
            ],
          },
        ],
        totalNftCount: 2,
        lowerPriceBound: '0.10',
        upperPriceBound: '4.30',
      });
    },
  );

  skipOnPriorFail(
    '/nfts with address filter (OK when >0 nfts owned, with pagination, page 2, with sort by name ascending)',
    async () => {
      const res = await request(app.getHttpServer()).get('/nfts').query({
        userAddress: 'addr',
        pageSize: '1',
        page: '2',
        orderBy: 'name',
        orderDirection: 'asc',
      });
      expect(res.statusCode).toEqual(200);

      for (const i in res.body.nfts) {
        expect(res.body.nfts[i].createdAt).toBeGreaterThan(0);
        expect(res.body.nfts[i].launchAt).toBeGreaterThan(0);
        delete res.body.nfts[i].createdAt;
        delete res.body.nfts[i].launchAt;

        if (typeof res.body.nfts[i].onsaleUntil !== 'undefined') {
          expect(res.body.nfts[i].onsaleUntil).toBeGreaterThan(0);
          delete res.body.nfts[i].onsaleUntil;
        }
      }

      expect(res.body).toStrictEqual({
        currentPage: 2,
        numberOfPages: 2,
        nfts: [
          {
            id: 4,
            name: 'The cat & the city',
            description: 'What s better then a cat in a city ?',
            ipfsHash: 'ipfs://.....',
            artifactUri:
              'https://images.unsplash.com/photo-1615639164213-aab04da93c7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1974&q=80',
            displayUri:
              'https://images.unsplash.com/photo-1615639164213-aab04da93c7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1974&q=80',
            thumbnailUri:
              'https://images.unsplash.com/photo-1615639164213-aab04da93c7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1974&q=80',
            price: '4.30',
            editionsSize: 8,
            editionsAvailable: 0,
            categories: [
              {
                id: 4,
                description: 'Sub fine art category',
                name: 'Drawing',
              },
            ],
          },
        ],
        totalNftCount: 2,
        lowerPriceBound: '0.10',
        upperPriceBound: '4.30',
      });
    },
  );

  skipOnPriorFail(
    '/nfts with address filter (OK when >0 nfts owned, with pagination, page 1, with sort by name descending)',
    async () => {
      const res = await request(app.getHttpServer()).get('/nfts').query({
        userAddress: 'addr',
        pageSize: '1',
        page: '1',
        orderBy: 'name',
        orderDirection: 'desc',
      });
      expect(res.statusCode).toEqual(200);

      for (const i in res.body.nfts) {
        expect(res.body.nfts[i].createdAt).toBeGreaterThan(0);
        expect(res.body.nfts[i].launchAt).toBeGreaterThan(0);
        delete res.body.nfts[i].createdAt;
        delete res.body.nfts[i].launchAt;

        if (typeof res.body.nfts[i].onsaleUntil !== 'undefined') {
          expect(res.body.nfts[i].onsaleUntil).toBeGreaterThan(0);
          delete res.body.nfts[i].onsaleUntil;
        }
      }

      expect(res.body).toStrictEqual({
        currentPage: 1,
        numberOfPages: 2,
        nfts: [
          {
            id: 4,
            name: 'The cat & the city',
            description: 'What s better then a cat in a city ?',
            ipfsHash: 'ipfs://.....',
            artifactUri:
              'https://images.unsplash.com/photo-1615639164213-aab04da93c7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1974&q=80',
            displayUri:
              'https://images.unsplash.com/photo-1615639164213-aab04da93c7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1974&q=80',
            thumbnailUri:
              'https://images.unsplash.com/photo-1615639164213-aab04da93c7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1974&q=80',
            price: '4.30',
            editionsSize: 8,
            editionsAvailable: 0,
            categories: [
              {
                id: 4,
                description: 'Sub fine art category',
                name: 'Drawing',
              },
            ],
          },
        ],
        totalNftCount: 2,
        lowerPriceBound: '0.10',
        upperPriceBound: '4.30',
      });
    },
  );

  skipOnPriorFail(
    '/nfts with address filter (OK when >0 nfts owned, with pagination, page 2, with sort by price ascending)',
    async () => {
      const res = await request(app.getHttpServer()).get('/nfts').query({
        userAddress: 'addr',
        pageSize: '1',
        page: '2',
        orderBy: 'price',
        orderDirection: 'asc',
      });
      expect(res.statusCode).toEqual(200);

      for (const i in res.body.nfts) {
        expect(res.body.nfts[i].createdAt).toBeGreaterThan(0);
        expect(res.body.nfts[i].launchAt).toBeGreaterThan(0);
        delete res.body.nfts[i].createdAt;
        delete res.body.nfts[i].launchAt;

        if (typeof res.body.nfts[i].onsaleUntil !== 'undefined') {
          expect(res.body.nfts[i].onsaleUntil).toBeGreaterThan(0);
          delete res.body.nfts[i].onsaleUntil;
        }
      }

      expect(res.body).toStrictEqual({
        currentPage: 2,
        numberOfPages: 2,
        totalNftCount: 2,
        nfts: [
          {
            id: 4,
            name: 'The cat & the city',
            description: 'What s better then a cat in a city ?',
            ipfsHash: 'ipfs://.....',
            artifactUri:
              'https://images.unsplash.com/photo-1615639164213-aab04da93c7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1974&q=80',
            displayUri:
              'https://images.unsplash.com/photo-1615639164213-aab04da93c7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1974&q=80',
            thumbnailUri:
              'https://images.unsplash.com/photo-1615639164213-aab04da93c7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1974&q=80',
            price: '4.30',
            editionsSize: 8,
            editionsAvailable: 0,
            categories: [
              {
                id: 4,
                description: 'Sub fine art category',
                name: 'Drawing',
              },
            ],
          },
        ],
        lowerPriceBound: '0.10',
        upperPriceBound: '4.30',
      });
    },
  );

  skipOnPriorFail(
    '/nfts with address filter (OK when >0 nfts owned, with pagination, page 1, with sort by price descending)',
    async () => {
      const res = await request(app.getHttpServer()).get('/nfts').query({
        userAddress: 'addr',
        pageSize: '1',
        page: '1',
        orderBy: 'price',
        orderDirection: 'desc',
      });
      expect(res.statusCode).toEqual(200);

      for (const i in res.body.nfts) {
        expect(res.body.nfts[i].createdAt).toBeGreaterThan(0);
        expect(res.body.nfts[i].launchAt).toBeGreaterThan(0);
        delete res.body.nfts[i].createdAt;
        delete res.body.nfts[i].launchAt;
        if (typeof res.body.nfts[i].onsaleUntil !== 'undefined') {
          expect(res.body.nfts[i].onsaleUntil).toBeGreaterThan(0);
          delete res.body.nfts[i].onsaleUntil;
        }
      }

      expect(res.body).toStrictEqual({
        currentPage: 1,
        numberOfPages: 2,
        totalNftCount: 2,
        nfts: [
          {
            id: 4,
            name: 'The cat & the city',
            description: 'What s better then a cat in a city ?',
            ipfsHash: 'ipfs://.....',
            artifactUri:
              'https://images.unsplash.com/photo-1615639164213-aab04da93c7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1974&q=80',
            displayUri:
              'https://images.unsplash.com/photo-1615639164213-aab04da93c7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1974&q=80',
            thumbnailUri:
              'https://images.unsplash.com/photo-1615639164213-aab04da93c7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1974&q=80',
            price: '4.30',
            editionsSize: 8,
            editionsAvailable: 0,
            categories: [
              {
                id: 4,
                description: 'Sub fine art category',
                name: 'Drawing',
              },
            ],
          },
        ],
        lowerPriceBound: '0.10',
        upperPriceBound: '4.30',
      });
    },
  );

  skipOnPriorFail(
    '/users/nftOwnership (not logged in => UNAUTHORIZED)',
    async () => {
      const res = await request(app.getHttpServer()).get(
        '/users/nftOwnershipsPending',
      );
      expect(res.statusCode).toEqual(401);
    },
  );

  skipOnPriorFail('/users/nftOwnership', async () => {
    const { bearer } = await loginUser(app, 'addr', 'admin');

    const res = await request(app.getHttpServer())
      .get('/users/nftOwnershipsPending')
      .set('authorization', bearer);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toStrictEqual([
      { nftId: '1', ownerStatuses: ['pending'] },
      {
        nftId: '4',
        ownerStatuses: ['pending', 'pending', 'pending', 'payment processing'],
      },
    ]);
  });

  skipOnPriorFail('/users/topBuyers', async () => {
    const res = await request(app.getHttpServer()).get('/users/topBuyers');
    expect(res.statusCode).toEqual(200);

    expect(res.body).toStrictEqual({
      topBuyers: [
        {
          userId: 1,
          userAddress: 'addr',
          userPicture: null,
          totalPaid: '13.00',
        },
      ],
    });
  });

  skipOnPriorFail(
    '/users/profile/edit: not changing the profile picture => BAD REQUEST',
    async () => {
      const { bearer } = await loginUser(app, 'addr', 'admin');

      const res = await request(app.getHttpServer())
        .post('/users/profile/edit')
        .set('authorization', bearer);

      expect(res.statusCode).toEqual(400);
    },
  );

  skipOnPriorFail('/categories', async () => {
    const res = await request(app.getHttpServer()).get('/categories');

    expect(res.statusCode).toEqual(200);
    expect(res.body).toStrictEqual([
      {
        id: 1,
        name: 'Fine Art',
        description: 'A collection of fine art devided in several categories',
        children: [
          {
            id: 4,
            name: 'Drawing',
            description: 'Sub fine art category',
            children: [],
          },
          {
            id: 5,
            name: 'Painting',
            description: 'Sub fine art category',
            children: [],
          },
          {
            id: 6,
            name: 'Sculpture',
            description: 'Sub fine art category',
            children: [],
          },
        ],
      },
      {
        id: 2,
        name: 'Visual Art',
        description: 'Not actually visual',
        children: [
          {
            id: 7,
            name: 'Digital',
            description: 'Sub visual art category',
            children: [],
          },
          {
            id: 8,
            name: 'Photography',
            description: 'Sub visual art category',
            children: [
              {
                id: 9,
                name: 'Abstract',
                description: 'Sub photography category',
                children: [],
              },
              {
                id: 10,
                name: 'Landscape',
                description: 'Sub photography category',
                children: [],
              },
              {
                id: 11,
                name: 'Portrait',
                description: 'Sub photography category',
                children: [],
              },
              {
                id: 12,
                name: 'Cities',
                description: 'Sub photography category',
                children: [
                  {
                    id: 13,
                    name: 'Honk Kong',
                    description: 'Sub cities category',
                    children: [],
                  },
                  {
                    id: 14,
                    name: 'Toronto',
                    description: 'Sub cities category',
                    children: [],
                  },
                  {
                    id: 15,
                    name: 'London',
                    description: 'Sub cities category',
                    children: [],
                  },
                ],
              },
              {
                id: 16,
                name: 'Black & White',
                description: 'Sub photography category',
                children: [],
              },
            ],
          },
        ],
      },
      {
        id: 3,
        name: 'Applied Art',
        description: 'Not actually visual',
        children: [],
      },
    ]);
  });

  skipOnPriorFail('/nft/delist: success case', async () => {
    const nftId = 1;
    let hexMsg = nftId.toString(16);
    if (hexMsg.length & 1) {
      // hex is of uneven length, sotez expects an even number of hexadecimal characters
      hexMsg = SIGNATURE_PREFIX_DELIST_NFT + '0' + hexMsg;
    }

    const nftExistsBeforeCheck = await request(app.getHttpServer()).post(
      `/nfts/${nftId}`,
    );
    expect(nftExistsBeforeCheck.statusCode).toEqual(201);

    const topBuyersResBefore = await request(app.getHttpServer()).get(
      '/users/topBuyers',
    );
    expect(topBuyersResBefore.statusCode).toEqual(200);
    expect(topBuyersResBefore.body).toStrictEqual({
      topBuyers: [
        {
          userId: 1,
          userAddress: 'addr',
          userPicture: null,
          totalPaid: '13.00',
        },
      ],
    });

    const ownedNftsBefore = await request(app.getHttpServer())
      .get('/nfts')
      .query({
        userAddress: 'addr',
        page: '1',
        orderBy: 'id',
      });
    expect(ownedNftsBefore.statusCode).toEqual(200);
    expect(ownedNftsBefore.body.nfts.map((nft: any) => nft.id)).toEqual([1, 4]);

    const signed = await cryptoUtils.sign(
      hexMsg,
      assertEnv('ADMIN_PRIVATE_KEY'),
    );

    const delistRes = await request(app.getHttpServer())
      .post(`/nfts/delist/${nftId}`)
      .send({
        signature: signed.sig,
      });
    expect(delistRes.statusCode).toEqual(201);

    // need to sleep, to make sure nothing is served from the cache
    await sleep(1000);

    // nft no longer exists now
    const nftExistsAfterCheck = await request(app.getHttpServer()).post(
      `/nfts/${nftId}`,
    );
    expect(nftExistsAfterCheck.statusCode).toEqual(400);

    // previous buys are no longer taken into the topBuyers sum
    const topBuyersResAfter = await request(app.getHttpServer()).get(
      '/users/topBuyers',
    );
    expect(topBuyersResAfter.statusCode).toEqual(200);
    expect(topBuyersResAfter.body).toStrictEqual({
      topBuyers: [
        {
          userId: 1,
          userAddress: 'addr',
          userPicture: null,
          totalPaid: '12.90',
        },
      ],
    });

    // the relisted nft is considered no longer owned by holders
    const ownedNftsAfter = await request(app.getHttpServer())
      .get('/nfts')
      .query({
        userAddress: 'addr',
        page: '1',
        orderBy: 'id',
      });
    expect(ownedNftsAfter.statusCode).toEqual(200);
    expect(ownedNftsAfter.body.nfts.map((nft: any) => nft.id)).toEqual([4]);
  });

  skipOnPriorFail('/nft/relist: success case', async () => {
    const nftId = 1;
    let hexMsg = nftId.toString(16);
    if (hexMsg.length & 1) {
      // hex is of uneven length, sotez expects an even number of hexadecimal characters
      hexMsg = SIGNATURE_PREFIX_RELIST_NFT + '0' + hexMsg;
    }

    const signed = await cryptoUtils.sign(
      hexMsg,
      assertEnv('ADMIN_PRIVATE_KEY'),
    );

    const relistRes = await request(app.getHttpServer())
      .post(`/nfts/relist/${nftId}`)
      .send({
        signature: signed.sig,
      });
    expect(relistRes.statusCode).toEqual(201);

    // need to sleep, to make sure nothing is served from the cache
    await sleep(1000);

    // nft exists again
    const nftExistsAfterCheck = await request(app.getHttpServer()).post(
      `/nfts/${nftId}`,
    );
    expect(nftExistsAfterCheck.statusCode).toEqual(201);

    // previous buys are recovered and taken into the topBuyers sum
    const topBuyersResAfter = await request(app.getHttpServer()).get(
      '/users/topBuyers',
    );
    expect(topBuyersResAfter.statusCode).toEqual(200);
    expect(topBuyersResAfter.body).toStrictEqual({
      topBuyers: [
        {
          userId: 1,
          userAddress: 'addr',
          userPicture: null,
          totalPaid: '13.00',
        },
      ],
    });

    // the relisted nft is considered owned again by holders
    const ownedNftsAfter = await request(app.getHttpServer())
      .get('/nfts')
      .query({
        userAddress: 'addr',
        page: '1',
        orderBy: 'id',
      });
    expect(ownedNftsAfter.statusCode).toEqual(200);
    expect(ownedNftsAfter.body.nfts.map((nft: any) => nft.id)).toEqual([1, 4]);
  });

  skipOnPriorFail('/nft/create: success case', async () => {
    const nftId = 100000;
    let hexMsg = nftId.toString(16);
    if (hexMsg.length & 1) {
      // hex is of uneven length, sotez expects an even number of hexadecimal characters
      hexMsg = SIGNATURE_PREFIX_CREATE_NFT + '0' + hexMsg;
    }

    const signed = await cryptoUtils.sign(
      hexMsg,
      assertEnv('ADMIN_PRIVATE_KEY'),
    );
    const res = await request(app.getHttpServer())
      .post('/nfts/create')
      .send({
        id: nftId,

        name: 'test',
        description: 'test description',

        artifactUri: 'some_s3_uri',

        price: '0.50',
        categories: [10],
        editionsSize: 4,

        launchAt: 0,
        signature: signed.sig,
      });

    expect(res.statusCode).toEqual(201);
  });

  skipOnPriorFail('/nft/create: bad signature => 403', async () => {
    const nftId = 100000;
    const res = await request(app.getHttpServer())
      .post('/nfts/create')
      .send({
        id: nftId,

        name: 'test',
        description: 'test description',

        artifactUri: 'some_s3_uri',

        price: '0.50',
        categories: [10],
        editionsSize: 4,

        launchAt: 0,
        signature: 'some invalid signature',
      });

    expect(res.statusCode).toEqual(401);
  });

  skipOnPriorFail('/users/profile: shows promised payment nfts', async () => {
    const { bearer } = await loginUser(app, 'addr', 'admin');

    const add8Res = await request(app.getHttpServer())
      .post('/users/cart/add/8')
      .set('authorization', bearer);
    expect(add8Res.status).toEqual(201);
    const add10Res = await request(app.getHttpServer())
      .post('/users/cart/add/10')
      .set('authorization', bearer);
    expect(add10Res.status).toEqual(201);
    const paymentIntentRes = await request(app.getHttpServer())
      .post('/payment/create-payment-intent')
      .set('authorization', bearer)
      .send({ currency: 'XTZ', paymentProvider: 'tezpay' });
    expect(paymentIntentRes.status).toEqual(201);
    const intentId = paymentIntentRes.body.id;
    delete paymentIntentRes.body.id;
    delete paymentIntentRes.body.clientSecret;
    expect(Number(paymentIntentRes.body.amount)).toBeGreaterThan(0);
    delete paymentIntentRes.body.amount;
    delete paymentIntentRes.body.expiresAt;
    for (const i in paymentIntentRes.body.nfts) {
      expect(Number(paymentIntentRes.body.nfts[i].price)).toBeGreaterThan(0);
      expect(paymentIntentRes.body.nfts[i].createdAt).toBeGreaterThan(0);
      expect(paymentIntentRes.body.nfts[i].launchAt).toBeGreaterThan(0);
      delete paymentIntentRes.body.nfts[i].price;
      delete paymentIntentRes.body.nfts[i].createdAt;
      delete paymentIntentRes.body.nfts[i].launchAt;
      if (typeof paymentIntentRes.body.nfts[i].onsaleUntil !== 'undefined') {
        expect(paymentIntentRes.body.nfts[i].onsaleUntil).toBeGreaterThan(0);
        delete paymentIntentRes.body.nfts[i].onsaleUntil;
      }
    }
    expect(paymentIntentRes.body).toEqual({
      currency: 'XTZ',
      nfts: [
        {
          artifactUri:
            'https://images.unsplash.com/photo-1544967082-d9d25d867d66?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MjB8fHBhaW50aW5nc3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=900&q=60',
          categories: [
            {
              description: 'Sub fine art category',
              id: 5,
              name: 'Painting',
            },
          ],
          description: 'Paintings from my twelve year old nephew',
          displayUri:
            'https://images.unsplash.com/photo-1544967082-d9d25d867d66?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MjB8fHBhaW50aW5nc3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=900&q=60',
          editionsAvailable: 7,
          editionsSize: 8,
          id: 8,
          ipfsHash: null,
          name: 'An didn t stop improving',
          thumbnailUri:
            'https://images.unsplash.com/photo-1544967082-d9d25d867d66?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MjB8fHBhaW50aW5nc3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=900&q=60',
        },
        {
          artifactUri:
            'https://images.unsplash.com/photo-1638186824584-6d6367254927?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHx0b3BpYy1mZWVkfDJ8YkRvNDhjVWh3bll8fGVufDB8fHx8&auto=format&fit=crop&w=900&q=60',
          categories: [
            {
              description: 'Sub fine art category',
              id: 6,
              name: 'Sculpture',
            },
          ],
          description:
            'Bronze sculpture of Antonin DVORAK who lived from 1841 - 1904',
          displayUri:
            'https://images.unsplash.com/photo-1638186824584-6d6367254927?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHx0b3BpYy1mZWVkfDJ8YkRvNDhjVWh3bll8fGVufDB8fHx8&auto=format&fit=crop&w=900&q=60',
          editionsAvailable: 7,
          editionsSize: 8,
          id: 10,
          ipfsHash: null,
          name: 'Antonin DVORAK',
          thumbnailUri:
            'https://images.unsplash.com/photo-1638186824584-6d6367254927?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHx0b3BpYy1mZWVkfDJ8YkRvNDhjVWh3bll8fGVufDB8fHx8&auto=format&fit=crop&w=900&q=60',
        },
      ],
      receiverAddress: 'KT1MZTPQFdEZKLXtdQzpuA4MFt5ZkmKqFqkq',
    });

    const paymentOrderNfts = await request(app.getHttpServer())
      .get(`/payment/nfts/${intentId}`)
      .set('authorization', bearer);
    delete paymentOrderNfts.body.expiresAt;
    for (const i in paymentOrderNfts.body.nfts) {
      expect(Number(paymentOrderNfts.body.nfts[i].price)).toBeGreaterThan(0);
      expect(paymentOrderNfts.body.nfts[i].createdAt).toBeGreaterThan(0);
      expect(paymentOrderNfts.body.nfts[i].launchAt).toBeGreaterThan(0);
      delete paymentOrderNfts.body.nfts[i].price;
      delete paymentOrderNfts.body.nfts[i].createdAt;
      delete paymentOrderNfts.body.nfts[i].launchAt;
      if (typeof paymentOrderNfts.body.nfts[i].onsaleUntil !== 'undefined') {
        expect(paymentOrderNfts.body.nfts[i].onsaleUntil).toBeGreaterThan(0);
        delete paymentOrderNfts.body.nfts[i].onsaleUntil;
      }
    }
    expect(paymentOrderNfts.status).toEqual(200);
    expect(paymentOrderNfts.body).toEqual({
      currency: 'XTZ',
      nfts: [
        {
          artifactUri:
            'https://images.unsplash.com/photo-1544967082-d9d25d867d66?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MjB8fHBhaW50aW5nc3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=900&q=60',
          categories: [
            {
              description: 'Sub fine art category',
              id: 5,
              name: 'Painting',
            },
          ],
          description: 'Paintings from my twelve year old nephew',
          displayUri:
            'https://images.unsplash.com/photo-1544967082-d9d25d867d66?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MjB8fHBhaW50aW5nc3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=900&q=60',
          editionsAvailable: 7,
          editionsSize: 8,
          id: 8,
          ipfsHash: null,
          name: 'An didn t stop improving',
          thumbnailUri:
            'https://images.unsplash.com/photo-1544967082-d9d25d867d66?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MjB8fHBhaW50aW5nc3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=900&q=60',
        },
        {
          artifactUri:
            'https://images.unsplash.com/photo-1638186824584-6d6367254927?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHx0b3BpYy1mZWVkfDJ8YkRvNDhjVWh3bll8fGVufDB8fHx8&auto=format&fit=crop&w=900&q=60',
          categories: [
            {
              description: 'Sub fine art category',
              id: 6,
              name: 'Sculpture',
            },
          ],
          description:
            'Bronze sculpture of Antonin DVORAK who lived from 1841 - 1904',
          displayUri:
            'https://images.unsplash.com/photo-1638186824584-6d6367254927?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHx0b3BpYy1mZWVkfDJ8YkRvNDhjVWh3bll8fGVufDB8fHx8&auto=format&fit=crop&w=900&q=60',
          editionsAvailable: 7,
          editionsSize: 8,
          id: 10,
          ipfsHash: null,
          name: 'Antonin DVORAK',
          thumbnailUri:
            'https://images.unsplash.com/photo-1638186824584-6d6367254927?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHx0b3BpYy1mZWVkfDJ8YkRvNDhjVWh3bll8fGVufDB8fHx8&auto=format&fit=crop&w=900&q=60',
        },
      ],
    });

    const resBefore = await request(app.getHttpServer())
      .get('/users/profile')
      .set('authorization', bearer);
    expect(resBefore.statusCode).toEqual(200);
    expect(resBefore.body.user?.createdAt).toBeGreaterThan(0);
    delete resBefore.body.user?.createdAt;

    for (const i in resBefore.body.collection.nfts) {
      expect(resBefore.body.collection.nfts[i].createdAt).toBeGreaterThan(0);
      expect(resBefore.body.collection.nfts[i].launchAt).toBeGreaterThan(0);
      delete resBefore.body.collection.nfts[i].createdAt;
      delete resBefore.body.collection.nfts[i].launchAt;
      if (
        typeof resBefore.body.collection.nfts[i].onsaleUntil !== 'undefined'
      ) {
        expect(resBefore.body.collection.nfts[i].onsaleUntil).toBeGreaterThan(
          0,
        );
        delete resBefore.body.collection.nfts[i].onsaleUntil;
      }
    }
    for (const i in resBefore.body.pendingOwnership) {
      expect(resBefore.body.pendingOwnership[i].createdAt).toBeGreaterThan(0);
      expect(resBefore.body.pendingOwnership[i].launchAt).toBeGreaterThan(0);
      delete resBefore.body.pendingOwnership[i].createdAt;
      delete resBefore.body.pendingOwnership[i].launchAt;
      if (
        typeof resBefore.body.pendingOwnership[i].onsaleUntil !== 'undefined'
      ) {
        expect(resBefore.body.pendingOwnership[i].onsaleUntil).toBeGreaterThan(
          0,
        );
        delete resBefore.body.pendingOwnership[i].onsaleUntil;
      }
    }

    expect(resBefore.body).toStrictEqual({
      collection: {
        currentPage: 1,
        lowerPriceBound: '0.10',
        nfts: [
          {
            artifactUri:
              'https://images.unsplash.com/photo-1603344204980-4edb0ea63148?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8ZHJhd2luZ3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=900&q=60',
            categories: [
              {
                description: 'Sub fine art category',
                id: 4,
                name: 'Drawing',
              },
            ],
            description:
              'Hey guys, here s the WL team ready to write some more code !',
            displayUri:
              'https://images.unsplash.com/photo-1603344204980-4edb0ea63148?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8ZHJhd2luZ3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=900&q=60',
            editionsAvailable: 3,
            editionsSize: 4,
            id: 1,
            ipfsHash: 'ipfs://.....',
            name: 'Cartoon',
            ownerStatuses: ['pending'],
            price: '0.10',
            thumbnailUri:
              'https://images.unsplash.com/photo-1603344204980-4edb0ea63148?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8ZHJhd2luZ3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=900&q=60',
          },
          {
            artifactUri:
              'https://images.unsplash.com/photo-1615639164213-aab04da93c7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1974&q=80',
            categories: [
              {
                description: 'Sub fine art category',
                id: 4,
                name: 'Drawing',
              },
            ],
            description: 'What s better then a cat in a city ?',
            displayUri:
              'https://images.unsplash.com/photo-1615639164213-aab04da93c7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1974&q=80',
            editionsAvailable: 0,
            editionsSize: 8,
            id: 4,
            ipfsHash: 'ipfs://.....',
            name: 'The cat & the city',
            ownerStatuses: ['pending', 'pending', 'pending'],
            price: '4.30',
            thumbnailUri:
              'https://images.unsplash.com/photo-1615639164213-aab04da93c7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1974&q=80',
          },
        ],
        numberOfPages: 1,
        totalNftCount: 2,
        upperPriceBound: '4.30',
      },
      pendingOwnership: [
        {
          artifactUri:
            'https://images.unsplash.com/photo-1615639164213-aab04da93c7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1974&q=80',
          categories: [
            {
              description: 'Sub fine art category',
              id: 4,
              name: 'Drawing',
            },
          ],
          description: 'What s better then a cat in a city ?',
          displayUri:
            'https://images.unsplash.com/photo-1615639164213-aab04da93c7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1974&q=80',
          editionsAvailable: 0,
          editionsSize: 8,
          id: 4,
          ipfsHash: 'ipfs://.....',
          name: 'The cat & the city',
          ownerStatuses: ['payment processing'],
          price: '4.30',
          thumbnailUri:
            'https://images.unsplash.com/photo-1615639164213-aab04da93c7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1974&q=80',
        },
      ], // nothing new yet (just what was already in processing state from a previous test
      user: {
        id: 1,
        userAddress: 'addr',
        profilePicture: null,
      },
    });

    const cartBefore = await request(app.getHttpServer())
      .post('/users/cart/list')
      .set('authorization', bearer);
    delete cartBefore.body.expiresAt;
    for (const i in cartBefore.body.nfts) {
      expect(cartBefore.body.nfts[i].createdAt).toBeGreaterThan(0);
      expect(cartBefore.body.nfts[i].launchAt).toBeGreaterThan(0);
      delete cartBefore.body.nfts[i].createdAt;
      delete cartBefore.body.nfts[i].launchAt;
      if (typeof cartBefore.body.nfts[i].onsaleUntil !== 'undefined') {
        expect(cartBefore.body.nfts[i].onsaleUntil).toBeGreaterThan(0);
        delete cartBefore.body.nfts[i].onsaleUntil;
      }
    }
    expect(cartBefore.body).toEqual({
      nfts: [
        {
          artifactUri:
            'https://images.unsplash.com/photo-1544967082-d9d25d867d66?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MjB8fHBhaW50aW5nc3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=900&q=60',
          categories: [
            {
              description: 'Sub fine art category',
              id: 5,
              name: 'Painting',
            },
          ],
          description: 'Paintings from my twelve year old nephew',
          displayUri:
            'https://images.unsplash.com/photo-1544967082-d9d25d867d66?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MjB8fHBhaW50aW5nc3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=900&q=60',
          editionsAvailable: 7,
          editionsSize: 8,
          id: 8,
          ipfsHash: null,
          name: 'An didn t stop improving',
          price: '23.20',
          thumbnailUri:
            'https://images.unsplash.com/photo-1544967082-d9d25d867d66?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MjB8fHBhaW50aW5nc3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=900&q=60',
        },
        {
          artifactUri:
            'https://images.unsplash.com/photo-1638186824584-6d6367254927?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHx0b3BpYy1mZWVkfDJ8YkRvNDhjVWh3bll8fGVufDB8fHx8&auto=format&fit=crop&w=900&q=60',
          categories: [
            {
              description: 'Sub fine art category',
              id: 6,
              name: 'Sculpture',
            },
          ],
          description:
            'Bronze sculpture of Antonin DVORAK who lived from 1841 - 1904',
          displayUri:
            'https://images.unsplash.com/photo-1638186824584-6d6367254927?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHx0b3BpYy1mZWVkfDJ8YkRvNDhjVWh3bll8fGVufDB8fHx8&auto=format&fit=crop&w=900&q=60',
          editionsAvailable: 7,
          editionsSize: 8,
          id: 10,
          ipfsHash: null,
          name: 'Antonin DVORAK',
          price: '9.20',
          thumbnailUri:
            'https://images.unsplash.com/photo-1638186824584-6d6367254927?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHx0b3BpYy1mZWVkfDJ8YkRvNDhjVWh3bll8fGVufDB8fHx8&auto=format&fit=crop&w=900&q=60',
        },
      ],
    });

    const promisePaidRes = await request(app.getHttpServer())
      .post('/payment/promise-paid')
      .send({ payment_id: intentId })
      .set('authorization', bearer);
    expect(promisePaidRes.status).toEqual(201);

    const cartAfter = await request(app.getHttpServer())
      .post('/users/cart/list')
      .set('authorization', bearer);
    delete cartAfter.body.expiresAt;
    expect(cartAfter.body).toEqual({
      nfts: [],
    });

    const resAfter = await request(app.getHttpServer())
      .get('/users/profile')
      .set('authorization', bearer);
    expect(resAfter.statusCode).toEqual(200);
    expect(resAfter.body.user?.createdAt).toBeGreaterThan(0);
    delete resAfter.body.user?.createdAt;
    for (const i in resAfter.body.collection.nfts) {
      expect(resAfter.body.collection.nfts[i].createdAt).toBeGreaterThan(0);
      expect(resAfter.body.collection.nfts[i].launchAt).toBeGreaterThan(0);
      delete resAfter.body.collection.nfts[i].createdAt;
      delete resAfter.body.collection.nfts[i].launchAt;
      if (typeof resAfter.body.collection.nfts[i].onsaleUntil !== 'undefined') {
        expect(resAfter.body.collection.nfts[i].onsaleUntil).toBeGreaterThan(0);
        delete resAfter.body.collection.nfts[i].onsaleUntil;
      }
    }
    for (const i in resAfter.body.pendingOwnership) {
      expect(resAfter.body.pendingOwnership[i].createdAt).toBeGreaterThan(0);
      expect(resAfter.body.pendingOwnership[i].launchAt).toBeGreaterThan(0);
      delete resAfter.body.pendingOwnership[i].createdAt;
      delete resAfter.body.pendingOwnership[i].launchAt;
      if (
        typeof resAfter.body.pendingOwnership[i].onsaleUntil !== 'undefined'
      ) {
        expect(resAfter.body.pendingOwnership[i].onsaleUntil).toBeGreaterThan(
          0,
        );
        delete resAfter.body.pendingOwnership[i].onsaleUntil;
      }
    }

    expect(resAfter.body).toStrictEqual({
      collection: {
        currentPage: 1,
        lowerPriceBound: '0.10',
        nfts: [
          {
            artifactUri:
              'https://images.unsplash.com/photo-1603344204980-4edb0ea63148?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8ZHJhd2luZ3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=900&q=60',
            categories: [
              {
                description: 'Sub fine art category',
                id: 4,
                name: 'Drawing',
              },
            ],
            description:
              'Hey guys, here s the WL team ready to write some more code !',
            displayUri:
              'https://images.unsplash.com/photo-1603344204980-4edb0ea63148?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8ZHJhd2luZ3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=900&q=60',
            editionsAvailable: 3,
            editionsSize: 4,
            id: 1,
            ipfsHash: 'ipfs://.....',
            name: 'Cartoon',
            ownerStatuses: ['pending'],
            price: '0.10',
            thumbnailUri:
              'https://images.unsplash.com/photo-1603344204980-4edb0ea63148?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8ZHJhd2luZ3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=900&q=60',
          },
          {
            artifactUri:
              'https://images.unsplash.com/photo-1615639164213-aab04da93c7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1974&q=80',
            categories: [
              {
                description: 'Sub fine art category',
                id: 4,
                name: 'Drawing',
              },
            ],
            description: 'What s better then a cat in a city ?',
            displayUri:
              'https://images.unsplash.com/photo-1615639164213-aab04da93c7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1974&q=80',
            editionsAvailable: 0,
            editionsSize: 8,
            id: 4,
            ipfsHash: 'ipfs://.....',
            name: 'The cat & the city',
            ownerStatuses: ['pending', 'pending', 'pending'],
            price: '4.30',
            thumbnailUri:
              'https://images.unsplash.com/photo-1615639164213-aab04da93c7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1974&q=80',
          },
        ],
        numberOfPages: 1,
        totalNftCount: 2,
        upperPriceBound: '4.30',
      },
      pendingOwnership: [
        {
          artifactUri:
            'https://images.unsplash.com/photo-1615639164213-aab04da93c7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1974&q=80',
          categories: [
            {
              description: 'Sub fine art category',
              id: 4,
              name: 'Drawing',
            },
          ],
          description: 'What s better then a cat in a city ?',
          displayUri:
            'https://images.unsplash.com/photo-1615639164213-aab04da93c7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1974&q=80',
          editionsAvailable: 0,
          editionsSize: 8,
          id: 4,
          ipfsHash: 'ipfs://.....',
          name: 'The cat & the city',
          ownerStatuses: ['payment processing'],
          price: '4.30',
          thumbnailUri:
            'https://images.unsplash.com/photo-1615639164213-aab04da93c7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1974&q=80',
        },
        {
          artifactUri:
            'https://images.unsplash.com/photo-1544967082-d9d25d867d66?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MjB8fHBhaW50aW5nc3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=900&q=60',
          categories: [
            {
              description: 'Sub fine art category',
              id: 5,
              name: 'Painting',
            },
          ],
          description: 'Paintings from my twelve year old nephew',
          displayUri:
            'https://images.unsplash.com/photo-1544967082-d9d25d867d66?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MjB8fHBhaW50aW5nc3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=900&q=60',
          editionsAvailable: 7,
          editionsSize: 8,
          id: 8,
          ipfsHash: null,
          name: 'An didn t stop improving',
          ownerStatuses: ['payment processing'],
          price: '23.20',
          thumbnailUri:
            'https://images.unsplash.com/photo-1544967082-d9d25d867d66?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MjB8fHBhaW50aW5nc3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=900&q=60',
        },
        {
          artifactUri:
            'https://images.unsplash.com/photo-1638186824584-6d6367254927?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHx0b3BpYy1mZWVkfDJ8YkRvNDhjVWh3bll8fGVufDB8fHx8&auto=format&fit=crop&w=900&q=60',
          categories: [
            {
              description: 'Sub fine art category',
              id: 6,
              name: 'Sculpture',
            },
          ],
          description:
            'Bronze sculpture of Antonin DVORAK who lived from 1841 - 1904',
          displayUri:
            'https://images.unsplash.com/photo-1638186824584-6d6367254927?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHx0b3BpYy1mZWVkfDJ8YkRvNDhjVWh3bll8fGVufDB8fHx8&auto=format&fit=crop&w=900&q=60',
          editionsAvailable: 7,
          editionsSize: 8,
          id: 10,
          ipfsHash: null,
          name: 'Antonin DVORAK',
          ownerStatuses: ['payment processing'],
          price: '9.20',
          thumbnailUri:
            'https://images.unsplash.com/photo-1638186824584-6d6367254927?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHx0b3BpYy1mZWVkfDJ8YkRvNDhjVWh3bll8fGVufDB8fHx8&auto=format&fit=crop&w=900&q=60',
        },
      ],
      user: {
        id: 1,
        userAddress: 'addr',
        profilePicture: null,
      },
    });

    // and finally, only logged in user sees their own pending nfts
    const resAfterOtherUser = await request(app.getHttpServer())
      .get('/users/profile')
      .query({ userAddress: 'addr' });
    expect(resAfterOtherUser.body.pendingOwnership).toEqual([]);
  });
});

async function loginUser(
  app: INestApplication,
  address: string,
  password: string,
): Promise<{ bearer: string; id: number; address: string }> {
  const login = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ userAddress: address, signedPayload: password });
  expect(login.statusCode).toEqual(201);

  return {
    bearer: `Bearer ${login.body.token}`,
    id: login.body.id,
    address: address,
  };
}
