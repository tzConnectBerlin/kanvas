import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { Roles } from 'src/role/entities/role.entity';
import { assertEnv } from 'src/utils';
import * as Pool from 'pg-pool';
import axios from 'axios';

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
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.enableShutdownHooks();
    await app.init();
  });
  afterEach(async () => {
    await app.close();
  });

  it(`/ (GET) => NOT FOUND (make sure the nestjs's Hello World page is gone)`, () => {
    return request(app.getHttpServer()).get('/').expect(404);
  });

  // Note:
  // - these tests expect responses related to a database that has been filled
  //   with data in store-api-server/script/populate-testdb.sql

  skipOnPriorFail(
    '/auth/login trying to log in for non-existing account addr => UNAUTHORIZED',
    async () => {
      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'this.account@doesnt.exist',
          password: '...',
        });
      expect(login.statusCode).toEqual(401);
    },
  );

  skipOnPriorFail(
    '/auth/login trying to log in for existing account addr with bad pass => UNAUTHORIZED',
    async () => {
      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'admin@tzconnect.com',
          password: 'bad password',
        });
      expect(login.statusCode).toEqual(401);
    },
  );

  skipOnPriorFail('admin can create new users', async () => {
    const { bearer } = await loginUser(
      app,
      'admin@tzconnect.com',
      'supersafepassword',
    );
    const res = await request(app.getHttpServer())
      .post('/user')
      .set('authorization', bearer)
      .send({
        email: 'regular_joe@bigbrother.co',
        userName: 'Regular Joe',
        password: 'somepass',
        roles: [Roles.editor, Roles.moderator],
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toStrictEqual({
      id: 2,
      roles: [Roles.editor, Roles.moderator],
      email: 'regular_joe@bigbrother.co',
      userName: 'Regular Joe',
    });
  });

  skipOnPriorFail('new user with 0 roles assigned is ok', async () => {
    const { bearer } = await loginUser(
      app,
      'admin@tzconnect.com',
      'supersafepassword',
    );
    const res = await request(app.getHttpServer())
      .post('/user')
      .set('authorization', bearer)
      .send({
        email: 'ben@bigbrother.co',
        userName: 'Ben',
        password: 'somepass',
        roles: [],
      });
    expect(res.statusCode).toEqual(201);
  });

  skipOnPriorFail('PATCH /nft/:id fails requires to be logged in', async () => {
    const res = await request(app.getHttpServer()).patch('/nft/1');
    expect(res.statusCode).toEqual(401);
  });

  skipOnPriorFail('GET /nft fails requires to be logged in', async () => {
    const res = await request(app.getHttpServer()).get('/nft');
    expect(res.statusCode).toEqual(401);
  });

  skipOnPriorFail(
    'GET /nft OK when logged in (empty res; no NFTs created yet)',
    async () => {
      const { bearer } = await loginUser(
        app,
        'admin@tzconnect.com',
        'supersafepassword',
      );
      const res = await request(app.getHttpServer())
        .get('/nft')
        .set('authorization', bearer);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toStrictEqual({ count: 0, data: [] });
    },
  );

  skipOnPriorFail(
    'PATCH /nft/:id of non-existing id is BAD REQUEST',
    async () => {
      const { bearer } = await loginUser(
        app,
        'admin@tzconnect.com',
        'supersafepassword',
      );
      const res = await request(app.getHttpServer())
        .patch('/nft/5')
        .set('authorization', bearer);

      expect(res.statusCode).toEqual(400);
    },
  );

  skipOnPriorFail(
    'PATCH /nft/:id with null id is OK and creates new NFT entry',
    async () => {
      const { bearer } = await loginUser(
        app,
        'admin@tzconnect.com',
        'supersafepassword',
      );
      const res = await request(app.getHttpServer())
        .patch('/nft/')
        .set('authorization', bearer);
      expect(res.statusCode).toEqual(200);

      expect(res.body.createdAt).toBeGreaterThan(0);
      expect(res.body.updatedAt).toBeGreaterThanOrEqual(res.body.createdAt);
      delete res.body.createdAt;
      delete res.body.updatedAt;

      expect(res.body).toStrictEqual({
        id: 1,
        state: 'creation',
        createdBy: 1,
        attributes: {},
        allowedActions: { name: 'string', create_ready: 'boolean' },
        stateInfo: {
          setup_nft: ['nft.name.length > 0', 'nft.create_ready'],
        },
      });
    },
  );

  skipOnPriorFail(
    'PATCH /nft/:id with null id with attribute values',
    async () => {
      const { bearer } = await loginUser(
        app,
        'admin@tzconnect.com',
        'supersafepassword',
      );
      const res = await request(app.getHttpServer())
        .patch('/nft')
        .set('authorization', bearer)
        .send({ name: JSON.stringify('test') });
      expect(res.statusCode).toEqual(200);

      expect(res.body.createdAt).toBeGreaterThan(0);
      expect(res.body.updatedAt).toBeGreaterThanOrEqual(res.body.createdAt);
      delete res.body.createdAt;
      delete res.body.updatedAt;

      expect(res.body).toStrictEqual({
        id: 2,
        state: 'creation',
        createdBy: 1,
        attributes: { name: 'test' },
        allowedActions: { name: 'string', create_ready: 'boolean' },
        stateInfo: {
          setup_nft: ['nft.create_ready'],
        },
      });
    },
  );

  skipOnPriorFail('GET /nft/:id requires login', async () => {
    const res = await request(app.getHttpServer()).get('/nft/2');
    expect(res.statusCode).toEqual(401);
  });

  skipOnPriorFail(
    'GET /nft/:id, allowedActions is based on logged in user',
    async () => {
      const admin = await loginUser(
        app,
        'admin@tzconnect.com',
        'supersafepassword',
      );
      let res = await request(app.getHttpServer())
        .get('/nft/2')
        .set('authorization', admin.bearer); // Admin was creator of nft/2
      expect(res.statusCode).toEqual(200);

      expect(res.body.createdAt).toBeGreaterThan(0);
      expect(res.body.updatedAt).toBeGreaterThan(0); // toEqual(res.body.createdAt);
      delete res.body.createdAt;
      delete res.body.updatedAt;

      expect(res.body).toStrictEqual({
        id: 2,
        state: 'creation',
        createdBy: 1,
        attributes: { name: 'test' },
        allowedActions: { name: 'string', create_ready: 'boolean' },
        stateInfo: {
          setup_nft: ['nft.create_ready'],
        },
      });

      const joe = await loginUser(app, 'regular_joe@bigbrother.co', 'somepass');

      res = await request(app.getHttpServer())
        .get('/nft/2')
        .set('authorization', joe.bearer); // Admin was creator of nft/2
      expect(res.statusCode).toEqual(200);

      expect(res.body.createdAt).toBeGreaterThan(0);
      expect(res.body.updatedAt).toBeGreaterThanOrEqual(res.body.createdAt);
      delete res.body.createdAt;
      delete res.body.updatedAt;

      expect(res.body).toStrictEqual({
        id: 2,
        state: 'creation',
        createdBy: 1,
        attributes: { name: 'test' },
        allowedActions: {},
        stateInfo: {
          setup_nft: ['nft.create_ready'],
        },
      });
    },
  );

  skipOnPriorFail(
    'patch /nft/:id action only allowed if in allowedActions',
    async () => {
      const joe = await loginUser(app, 'regular_joe@bigbrother.co', 'somepass');
      const admin = await loginUser(
        app,
        'admin@tzconnect.com',
        'supersafepassword',
      );

      let res = await request(app.getHttpServer())
        .patch('/nft')
        .set('authorization', joe.bearer);
      expect(res.statusCode).toEqual(200);

      const nftId = res.body.id;

      res = await request(app.getHttpServer())
        .get(`/nft/${nftId}`)
        .set('authorization', joe.bearer);
      expect(res.body.allowedActions).toEqual({
        name: 'string',
        create_ready: 'boolean',
      });

      res = await request(app.getHttpServer())
        .get(`/nft/${nftId}`)
        .set('authorization', admin.bearer);
      expect(res.body.allowedActions).toEqual({});

      res = await request(app.getHttpServer())
        .patch(`/nft/${nftId}`)
        .set('authorization', admin.bearer)
        .send({ name: JSON.stringify('this will be forbidden') });
      expect(res.statusCode).toEqual(403);

      res = await request(app.getHttpServer())
        .patch(`/nft/${nftId}`)
        .set('authorization', joe.bearer)
        .send({
          name: JSON.stringify('this will be accepted, user is the creator'),
        });
      expect(res.statusCode).toEqual(200);
    },
  );

  skipOnPriorFail(
    'NFT can still be removed when in creation state',
    async () => {
      const { bearer } = await loginUser(
        app,
        'admin@tzconnect.com',
        'supersafepassword',
      );
      let res = await request(app.getHttpServer())
        .patch('/nft')
        .set('authorization', bearer);
      expect(res.statusCode).toEqual(200);

      const nftId = res.body.id;

      res = await request(app.getHttpServer())
        .get(`/nft/${nftId}`)
        .set('authorization', bearer);
      expect(res.statusCode).toEqual(200);
      expect(res.body.state).toEqual('creation');

      res = await request(app.getHttpServer())
        .delete(`/nft/${nftId}`)
        .set('authorization', bearer);
      expect(res.statusCode).toEqual(200);

      res = await request(app.getHttpServer())
        .get(`/nft/${nftId}`)
        .set('authorization', bearer);
      expect(res.statusCode).toEqual(400);
    },
  );

  skipOnPriorFail(
    'NFT cannot be removed when in is past setup_nft state',
    async () => {
      const { bearer } = await loginUser(
        app,
        'admin@tzconnect.com',
        'supersafepassword',
      );
      let res = await request(app.getHttpServer())
        .patch('/nft')
        .set('authorization', bearer)
        .send({
          name: JSON.stringify('some name'),
          create_ready: JSON.stringify(true),
        });
      expect(res.statusCode).toEqual(200);

      const nftId = res.body.id;
      res = await request(app.getHttpServer())
        .patch(`/nft/${nftId}`)
        .set('authorization', bearer)
        .send({
          price: JSON.stringify(105),
          categories: JSON.stringify([2, 5, 10]),
          editions_size: JSON.stringify(4),
          proposed: JSON.stringify(true),
          onsale_from: JSON.stringify(Date.now() + 30 * 60 * 1000),
        });

      expect(res.body.state).toEqual('proposed');

      res = await request(app.getHttpServer())
        .delete(`/nft/${nftId}`)
        .set('authorization', bearer);
      expect(res.statusCode).toEqual(403);
    },
  );

  skipOnPriorFail(
    'NFT cannot be removed by anyone else than the creator or an admin',
    async () => {
      const joe = await loginUser(app, 'regular_joe@bigbrother.co', 'somepass');
      const ben = await loginUser(app, 'ben@bigbrother.co', 'somepass');
      let res = await request(app.getHttpServer())
        .patch('/nft')
        .set('authorization', joe.bearer);
      expect(res.statusCode).toEqual(200);

      const nftId = res.body.id;

      res = await request(app.getHttpServer())
        .delete(`/nft/${nftId}`)
        .set('authorization', ben.bearer);
      expect(res.statusCode).toEqual(403);
    },
  );

  skipOnPriorFail(
    'NFT can still be removed when in setup_nft state',
    async () => {
      const { bearer } = await loginUser(
        app,
        'admin@tzconnect.com',
        'supersafepassword',
      );
      let res = await request(app.getHttpServer())
        .patch('/nft')
        .set('authorization', bearer)
        .send({
          name: JSON.stringify('test name'),
          create_ready: JSON.stringify(true),
        });
      expect(res.statusCode).toEqual(200);

      const nftId = res.body.id;

      res = await request(app.getHttpServer())
        .get(`/nft/${nftId}`)
        .set('authorization', bearer);
      expect(res.statusCode).toEqual(200);
      expect(res.body.state).toEqual('setup_nft');

      res = await request(app.getHttpServer())
        .delete(`/nft/${nftId}`)
        .set('authorization', bearer);
      expect(res.statusCode).toEqual(200);

      res = await request(app.getHttpServer())
        .get(`/nft/${nftId}`)
        .set('authorization', bearer);
      expect(res.statusCode).toEqual(400);
    },
  );

  skipOnPriorFail(
    'PATCH /nft/:id can overwrite previously set attributes (of course only if still in the same state)',
    async () => {
      const { bearer } = await loginUser(
        app,
        'admin@tzconnect.com',
        'supersafepassword',
      );
      let res = await request(app.getHttpServer())
        .patch('/nft')
        .set('authorization', bearer)
        .send({ name: JSON.stringify('test') });
      expect(res.statusCode).toEqual(200);

      expect(res.body.createdAt).toBeGreaterThan(0);
      expect(res.body.updatedAt).toBeGreaterThanOrEqual(res.body.createdAt);
      delete res.body.createdAt;
      delete res.body.updatedAt;

      expect(res.body).toStrictEqual({
        id: 8,
        state: 'creation',
        createdBy: 1,
        attributes: { name: 'test' },
        allowedActions: { name: 'string', create_ready: 'boolean' },
        stateInfo: {
          setup_nft: ['nft.create_ready'],
        },
      });

      res = await request(app.getHttpServer())
        .patch('/nft/8')
        .set('authorization', bearer)
        .send({ name: JSON.stringify('modified name') });

      expect(res.body.createdAt).toBeGreaterThan(0);
      expect(res.body.updatedAt).toBeGreaterThanOrEqual(res.body.createdAt);
      delete res.body.createdAt;
      delete res.body.updatedAt;

      expect(res.body).toStrictEqual({
        id: 8,
        state: 'creation',
        createdBy: 1,
        attributes: { name: 'modified name' },
        allowedActions: { name: 'string', create_ready: 'boolean' },
        stateInfo: {
          setup_nft: ['nft.create_ready'],
        },
      });

      res = await request(app.getHttpServer())
        .patch('/nft/8')
        .set('authorization', bearer)
        .send({ create_ready: JSON.stringify(true) });

      expect(res.body.createdAt).toBeGreaterThan(0);
      expect(res.body.updatedAt).toBeGreaterThanOrEqual(res.body.createdAt);
      delete res.body.createdAt;
      delete res.body.updatedAt;

      expect(res.body).toStrictEqual({
        id: 8,
        state: 'setup_nft',
        createdBy: 1,
        attributes: { name: 'modified name', create_ready: true },
        allowedActions: {
          categories: 'number[]',
          editions_size: 'number',
          price: 'number',
          onsale_from: 'date',
          proposed: 'boolean',
        },
        stateInfo: {
          proposed: [
            'nft.proposed',
            'nft.editions_size > 0',
            'nft.price > 0',
            'nft.categories.length > 0',
            'nft.onsale_from >= Date.now()',
          ],
        },
      });
    },
  );

  skipOnPriorFail(
    'GET /nft OK when logged in (with res; some NFTs have now been created)',
    async () => {
      const { bearer } = await loginUser(
        app,
        'admin@tzconnect.com',
        'supersafepassword',
      );
      const res = await request(app.getHttpServer())
        .get('/nft')
        .set('authorization', bearer);
      expect(res.statusCode).toEqual(200);

      for (const i in res.body.data) {
        expect(res.body.data[i].createdAt).toBeGreaterThan(0);
        expect(res.body.data[i].updatedAt).toBeGreaterThanOrEqual(
          res.body.data[i].createdAt,
        );
        delete res.body.data[i].createdAt;
        delete res.body.data[i].updatedAt;

        delete res.body.data[i].attributes.onsale_from;
      }

      expect(res.body).toStrictEqual({
        count: 6,
        data: [
          {
            id: 1,
            state: 'creation',
            createdBy: 1,
            attributes: {},
          },
          {
            id: 2,
            state: 'creation',
            createdBy: 1,
            attributes: { name: 'test' },
          },
          {
            id: 3,
            state: 'creation',
            createdBy: 2,
            attributes: { name: 'this will be accepted, user is the creator' },
          },
          {
            attributes: {
              categories: [2, 5, 10],
              create_ready: true,
              editions_size: 4,
              name: 'some name',
              price: 105,
              proposed: true,
            },
            createdBy: 1,
            id: 5,
            state: 'proposed',
          },
          {
            id: 6,
            state: 'creation',
            createdBy: 2,
            attributes: {},
          },
          {
            id: 8,
            state: 'setup_nft',
            createdBy: 1,
            attributes: { name: 'modified name', create_ready: true },
          },
        ],
      });
    },
  );

  skipOnPriorFail('GET /nft pagination tests', async () => {
    const { bearer } = await loginUser(
      app,
      'admin@tzconnect.com',
      'supersafepassword',
    );
    let res = await request(app.getHttpServer())
      .get('/nft')
      .set('authorization', bearer)
      .query({ range: JSON.stringify([0, 2]) });
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.map((row: any) => row.id)).toStrictEqual([1, 2]);

    res = await request(app.getHttpServer())
      .get('/nft')
      .set('authorization', bearer)
      .query({ range: JSON.stringify([1, 2]) });
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.map((row: any) => row.id)).toStrictEqual([2, 3]);

    res = await request(app.getHttpServer())
      .get('/nft')
      .set('authorization', bearer)
      .query({
        sort: JSON.stringify(['id', 'desc']),
        range: JSON.stringify([0, 2]),
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.map((row: any) => row.id)).toStrictEqual([8, 6]);
  });

  skipOnPriorFail(
    'nft list, <1 page or <0 page size => BAD REQUEST',
    async () => {
      const { bearer } = await loginUser(
        app,
        'regular_joe@bigbrother.co',
        'somepass',
      );
      let res = await request(app.getHttpServer())
        .get('/nft')
        .set('authorization', bearer)
        .query({ range: JSON.stringify([0, 0]) });
      expect(res.statusCode).toEqual(400);
      res = await request(app.getHttpServer())
        .get('/nft')
        .set('authorization', bearer)
        .query({ range: JSON.stringify([2, -1]) });
      expect(res.statusCode).toEqual(400);
      res = await request(app.getHttpServer())
        .get('/nft')
        .set('authorization', bearer)
        .query({ range: JSON.stringify([-1, 1]) });
      expect(res.statusCode).toEqual(400);
    },
  );

  skipOnPriorFail(
    'nft list, only asc,desc orderDirection accepted otherwise BAD REQUEST',
    async () => {
      const { bearer } = await loginUser(
        app,
        'regular_joe@bigbrother.co',
        'somepass',
      );
      let res = await request(app.getHttpServer())
        .get('/nft')
        .set('authorization', bearer)
        .query({ sort: JSON.stringify(['id', 'des']) });
      expect(res.statusCode).toEqual(400);
      res = await request(app.getHttpServer())
        .get('/nft')
        .set('authorization', bearer)
        .query({
          sort: JSON.stringify(['id', 'some non allowed string;']),
        });
      expect(res.statusCode).toEqual(400);
    },
  );

  skipOnPriorFail(
    'nft list is sortable by id,state,created_at,updated_at and STM defined attributes',
    async () => {
      const { bearer } = await loginUser(
        app,
        'regular_joe@bigbrother.co',
        'somepass',
      );
      let res = await request(app.getHttpServer())
        .get('/nft')
        .set('authorization', bearer)
        .query({ sort: JSON.stringify(['id']) });
      expect(res.statusCode).toEqual(200);

      for (const i in res.body.data) {
        expect(res.body.data[i].createdAt).toBeGreaterThan(0);
        expect(res.body.data[i].updatedAt).toBeGreaterThanOrEqual(
          res.body.data[i].createdAt,
        );
        delete res.body.data[i].createdAt;
        delete res.body.data[i].updatedAt;

        delete res.body.data[i].attributes.onsale_from;
      }

      expect(res.body).toStrictEqual({
        count: 6,
        data: [
          {
            id: 1,
            state: 'creation',
            createdBy: 1,
            attributes: {},
          },
          {
            id: 2,
            state: 'creation',
            createdBy: 1,
            attributes: { name: 'test' },
          },
          {
            id: 3,
            state: 'creation',
            createdBy: 2,
            attributes: { name: 'this will be accepted, user is the creator' },
          },
          {
            attributes: {
              categories: [2, 5, 10],
              create_ready: true,
              editions_size: 4,
              name: 'some name',
              price: 105,
              proposed: true,
            },
            createdBy: 1,
            id: 5,
            state: 'proposed',
          },
          {
            id: 6,
            state: 'creation',
            createdBy: 2,
            attributes: {},
          },
          {
            id: 8,
            state: 'setup_nft',
            createdBy: 1,
            attributes: { name: 'modified name', create_ready: true },
          },
        ],
      });

      res = await request(app.getHttpServer())
        .get('/nft')
        .set('authorization', bearer)
        .query({ sort: JSON.stringify(['state']) });
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.map((row: any) => row.id)).toStrictEqual([
        1, 2, 3, 6, 5, 8,
      ]);

      res = await request(app.getHttpServer())
        .get('/nft')
        .set('authorization', bearer)
        .query({ sort: JSON.stringify(['created_at']) });
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.map((row: any) => row.id)).toStrictEqual([
        1, 2, 3, 5, 6, 8,
      ]);

      res = await request(app.getHttpServer())
        .get('/nft')
        .set('authorization', bearer)
        .query({ sort: JSON.stringify(['updated_at']) });
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.map((row: any) => row.id)).toStrictEqual([
        1, 2, 3, 5, 6, 8,
      ]);

      res = await request(app.getHttpServer())
        .get('/nft')
        .set('authorization', bearer)
        .query({ sort: JSON.stringify(['name']) });
      expect(res.statusCode).toEqual(200);

      for (const i in res.body.data) {
        expect(res.body.data[i].createdAt).toBeGreaterThan(0);
        expect(res.body.data[i].updatedAt).toBeGreaterThanOrEqual(
          res.body.data[i].createdAt,
        );
        delete res.body.data[i].createdAt;
        delete res.body.data[i].updatedAt;

        delete res.body.data[i].attributes.onsale_from;
      }

      expect(res.body).toStrictEqual({
        count: 6,
        data: [
          {
            id: 8,
            state: 'setup_nft',
            createdBy: 1,
            attributes: { name: 'modified name', create_ready: true },
          },
          {
            attributes: {
              categories: [2, 5, 10],
              create_ready: true,
              editions_size: 4,
              name: 'some name',
              price: 105,
              proposed: true,
            },
            createdBy: 1,
            id: 5,
            state: 'proposed',
          },
          {
            id: 2,
            state: 'creation',
            createdBy: 1,
            attributes: { name: 'test' },
          },
          {
            id: 3,
            state: 'creation',
            createdBy: 2,
            attributes: { name: 'this will be accepted, user is the creator' },
          },
          {
            id: 1,
            state: 'creation',
            createdBy: 1,
            attributes: {},
          },
          {
            id: 6,
            state: 'creation',
            createdBy: 2,
            attributes: {},
          },
        ],
      });

      res = await request(app.getHttpServer())
        .get('/nft')
        .set('authorization', bearer)
        .query({ sort: JSON.stringify(['create_ready']) });
      expect(res.statusCode).toEqual(200);

      for (const i in res.body.data) {
        expect(res.body.data[i].createdAt).toBeGreaterThan(0);
        expect(res.body.data[i].updatedAt).toBeGreaterThanOrEqual(
          res.body.data[i].createdAt,
        );
        delete res.body.data[i].createdAt;
        delete res.body.data[i].updatedAt;

        delete res.body.data[i].attributes.onsale_from;
      }

      expect(res.body).toStrictEqual({
        count: 6,
        data: [
          {
            attributes: {
              categories: [2, 5, 10],
              create_ready: true,
              editions_size: 4,
              name: 'some name',
              price: 105,
              proposed: true,
            },
            createdBy: 1,
            id: 5,
            state: 'proposed',
          },
          {
            id: 8,
            state: 'setup_nft',
            createdBy: 1,
            attributes: { name: 'modified name', create_ready: true },
          },
          {
            id: 1,
            state: 'creation',
            createdBy: 1,
            attributes: {},
          },
          {
            id: 2,
            state: 'creation',
            createdBy: 1,
            attributes: { name: 'test' },
          },
          {
            id: 3,
            state: 'creation',
            createdBy: 2,
            attributes: { name: 'this will be accepted, user is the creator' },
          },
          {
            id: 6,
            state: 'creation',
            createdBy: 2,
            attributes: {},
          },
        ],
      });
    },
  );

  skipOnPriorFail(
    'nft list, any non supported sort field => BAD REQUEST',
    async () => {
      const { bearer } = await loginUser(
        app,
        'regular_joe@bigbrother.co',
        'somepass',
      );
      let res = await request(app.getHttpServer())
        .get('/nft')
        .set('authorization', bearer)
        .query({ sort: JSON.stringify(['email']) });
      expect(res.statusCode).toEqual(400);

      res = await request(app.getHttpServer())
        .get('/nft')
        .set('authorization', bearer)
        .query({ sort: JSON.stringify(['something malicious;']) });
      expect(res.statusCode).toEqual(400);
    },
  );

  skipOnPriorFail('nft list is filterable by id,state', async () => {
    const { bearer } = await loginUser(
      app,
      'regular_joe@bigbrother.co',
      'somepass',
    );
    let res = await request(app.getHttpServer())
      .get('/nft')
      .set('authorization', bearer)
      .query({ nftStates: 'creation' });
    expect(res.statusCode).toEqual(200);

    for (const i in res.body.data) {
      expect(res.body.data[i].createdAt).toBeGreaterThan(0);
      expect(res.body.data[i].updatedAt).toBeGreaterThanOrEqual(
        res.body.data[i].createdAt,
      );
      delete res.body.data[i].createdAt;
      delete res.body.data[i].updatedAt;
    }

    expect(res.body).toStrictEqual({
      count: 4,
      data: [
        {
          id: 1,
          state: 'creation',
          createdBy: 1,
          attributes: {},
        },
        {
          id: 2,
          state: 'creation',
          createdBy: 1,
          attributes: { name: 'test' },
        },
        {
          id: 3,
          state: 'creation',
          createdBy: 2,
          attributes: { name: 'this will be accepted, user is the creator' },
        },
        {
          id: 6,
          state: 'creation',
          createdBy: 2,
          attributes: {},
        },
      ],
    });

    res = await request(app.getHttpServer())
      .get('/nft')
      .set('authorization', bearer)
      .query({ nftStates: 'setup_nft' });
    expect(res.statusCode).toEqual(200);

    for (const i in res.body.data) {
      expect(res.body.data[i].createdAt).toBeGreaterThan(0);
      expect(res.body.data[i].updatedAt).toBeGreaterThanOrEqual(
        res.body.data[i].createdAt,
      );
      delete res.body.data[i].createdAt;
      delete res.body.data[i].updatedAt;
    }

    expect(res.body).toStrictEqual({
      count: 1,
      data: [
        {
          id: 8,
          state: 'setup_nft',
          createdBy: 1,
          attributes: { name: 'modified name', create_ready: true },
        },
      ],
    });

    res = await request(app.getHttpServer())
      .get('/nft')
      .set('authorization', bearer)
      .query({ nftStates: 'setup_nft,creation' });
    expect(res.statusCode).toEqual(200);

    for (const i in res.body.data) {
      expect(res.body.data[i].createdAt).toBeGreaterThan(0);
      expect(res.body.data[i].updatedAt).toBeGreaterThanOrEqual(
        res.body.data[i].createdAt,
      );
      delete res.body.data[i].createdAt;
      delete res.body.data[i].updatedAt;
    }

    expect(res.body).toStrictEqual({
      count: 5,
      data: [
        {
          id: 1,
          state: 'creation',
          createdBy: 1,
          attributes: {},
        },
        {
          id: 2,
          state: 'creation',
          createdBy: 1,
          attributes: { name: 'test' },
        },
        {
          id: 3,
          state: 'creation',
          createdBy: 2,
          attributes: { name: 'this will be accepted, user is the creator' },
        },
        {
          id: 6,
          state: 'creation',
          createdBy: 2,
          attributes: {},
        },
        {
          id: 8,
          state: 'setup_nft',
          createdBy: 1,
          attributes: { name: 'modified name', create_ready: true },
        },
      ],
    });

    res = await request(app.getHttpServer())
      .get('/nft')
      .set('authorization', bearer)
      .query({ nftIds: '3,6,8', nftStates: 'creation' });
    expect(res.statusCode).toEqual(200);

    for (const i in res.body.data) {
      expect(res.body.data[i].createdAt).toBeGreaterThan(0);
      expect(res.body.data[i].updatedAt).toBeGreaterThanOrEqual(
        res.body.data[i].createdAt,
      );
      delete res.body.data[i].createdAt;
      delete res.body.data[i].updatedAt;
    }

    expect(res.body).toStrictEqual({
      count: 2,
      data: [
        {
          id: 3,
          state: 'creation',
          createdBy: 2,
          attributes: { name: 'this will be accepted, user is the creator' },
        },
        {
          id: 6,
          state: 'creation',
          createdBy: 2,
          attributes: {},
        },
      ],
    });

    res = await request(app.getHttpServer())
      .get('/nft')
      .set('authorization', bearer)
      .query({ nftIds: '3,8' });
    expect(res.statusCode).toEqual(200);

    for (const i in res.body.data) {
      expect(res.body.data[i].createdAt).toBeGreaterThan(0);
      expect(res.body.data[i].updatedAt).toBeGreaterThanOrEqual(
        res.body.data[i].createdAt,
      );
      delete res.body.data[i].createdAt;
      delete res.body.data[i].updatedAt;
    }

    expect(res.body).toStrictEqual({
      count: 2,
      data: [
        {
          id: 3,
          state: 'creation',
          createdBy: 2,
          attributes: { name: 'this will be accepted, user is the creator' },
        },
        {
          id: 8,
          state: 'setup_nft',
          createdBy: 1,
          attributes: { name: 'modified name', create_ready: true },
        },
      ],
    });
  });

  skipOnPriorFail(`new user's roles must all be valid`, async () => {
    const { bearer } = await loginUser(
      app,
      'admin@tzconnect.com',
      'supersafepassword',
    );
    const res = await request(app.getHttpServer())
      .post('/user')
      .set('authorization', bearer)
      .send({
        email: 'hank@bigbrother.co',
        userName: 'Hank',
        password: 'somepass',
        roles: [2, 0], // 0 is invalid here
      });
    expect(res.statusCode).toEqual(400);
  });

  skipOnPriorFail('non-admin cannot create new users', async () => {
    const { bearer } = await loginUser(
      app,
      'regular_joe@bigbrother.co',
      'somepass',
    );
    const res = await request(app.getHttpServer())
      .post('/user')
      .set('authorization', bearer)
      .send({
        email: 'jane@bigbrother.co',
        userName: 'Jane',
        password: 'pass',
        roles: [3],
      });
    expect(res.statusCode).toEqual(403);
  });

  skipOnPriorFail('any logged in user can list users', async () => {
    const { bearer } = await loginUser(
      app,
      'regular_joe@bigbrother.co',
      'somepass',
    );
    const res = await request(app.getHttpServer())
      .get('/user')
      .set('authorization', bearer);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({
      count: 3,
      data: [
        {
          id: 1,
          email: 'admin@tzconnect.com',
          userName: 'admin',
          roles: [Roles.admin],
        },
        {
          id: 2,
          email: 'regular_joe@bigbrother.co',
          userName: 'Regular Joe',
          roles: [Roles.editor, Roles.moderator],
        },
        {
          id: 3,
          email: 'ben@bigbrother.co',
          userName: 'Ben',
          roles: [],
        },
      ],
    });
  });

  skipOnPriorFail('users list is sortable desc', async () => {
    const { bearer } = await loginUser(
      app,
      'regular_joe@bigbrother.co',
      'somepass',
    );
    const res = await request(app.getHttpServer())
      .get('/user')
      .set('authorization', bearer)
      .query({ sort: JSON.stringify(['id', 'desc']) });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({
      count: 3,
      data: [
        {
          id: 3,
          email: 'ben@bigbrother.co',
          userName: 'Ben',
          roles: [],
        },
        {
          id: 2,
          email: 'regular_joe@bigbrother.co',
          userName: 'Regular Joe',
          roles: [Roles.editor, Roles.moderator],
        },
        {
          id: 1,
          email: 'admin@tzconnect.com',
          userName: 'admin',
          roles: [Roles.admin],
        },
      ],
    });
  });

  skipOnPriorFail('users list is paginated', async () => {
    const { bearer } = await loginUser(
      app,
      'regular_joe@bigbrother.co',
      'somepass',
    );
    const res = await request(app.getHttpServer())
      .get('/user')
      .set('authorization', bearer)
      .query({
        sort: JSON.stringify(['id', 'desc']),
        range: JSON.stringify([0, 2]),
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({
      count: 3,
      data: [
        {
          id: 3,
          email: 'ben@bigbrother.co',
          userName: 'Ben',
          roles: [],
        },
        {
          id: 2,
          email: 'regular_joe@bigbrother.co',
          userName: 'Regular Joe',
          roles: [Roles.editor, Roles.moderator],
        },
      ],
    });
  });

  skipOnPriorFail('users list is paginated (part 2)', async () => {
    const { bearer } = await loginUser(
      app,
      'regular_joe@bigbrother.co',
      'somepass',
    );
    const res = await request(app.getHttpServer())
      .get('/user')
      .set('authorization', bearer)
      .query({
        sort: JSON.stringify(['id', 'desc']),
        range: JSON.stringify([2, 3]),
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({
      count: 3,
      data: [
        {
          id: 1,
          email: 'admin@tzconnect.com',
          userName: 'admin',
          roles: [Roles.admin],
        },
      ],
    });
  });

  skipOnPriorFail(
    'users list, <1 page or <0 page size => BAD REQUEST',
    async () => {
      const { bearer } = await loginUser(
        app,
        'regular_joe@bigbrother.co',
        'somepass',
      );
      let res = await request(app.getHttpServer())
        .get('/user')
        .set('authorization', bearer)
        .query({ range: JSON.stringify([0, 0]) });
      expect(res.statusCode).toEqual(400);
      res = await request(app.getHttpServer())
        .get('/user')
        .set('authorization', bearer)
        .query({ range: JSON.stringify([2, -1]) });
      expect(res.statusCode).toEqual(400);
      res = await request(app.getHttpServer())
        .get('/user')
        .set('authorization', bearer)
        .query({ range: JSON.stringify([-1, 1]) });
      expect(res.statusCode).toEqual(400);
    },
  );

  skipOnPriorFail(
    'users list, only asc,desc orderDirection accepted otherwise BAD REQUEST',
    async () => {
      const { bearer } = await loginUser(
        app,
        'regular_joe@bigbrother.co',
        'somepass',
      );
      let res = await request(app.getHttpServer())
        .get('/user')
        .set('authorization', bearer)
        .query({ sort: JSON.stringify(['id', 'des']) });
      expect(res.statusCode).toEqual(400);
      res = await request(app.getHttpServer())
        .get('/user')
        .set('authorization', bearer)
        .query({
          sort: JSON.stringify(['id', 'some non allowed string;']),
        });
      expect(res.statusCode).toEqual(400);
    },
  );

  skipOnPriorFail(
    'users list is sortable by id,email,userName,roles',
    async () => {
      const { bearer } = await loginUser(
        app,
        'regular_joe@bigbrother.co',
        'somepass',
      );
      let res = await request(app.getHttpServer())
        .get('/user')
        .set('authorization', bearer)
        .query({ sort: JSON.stringify(['id']) });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({
        count: 3,
        data: [
          {
            id: 1,
            email: 'admin@tzconnect.com',
            userName: 'admin',
            roles: [Roles.admin],
          },
          {
            id: 2,
            email: 'regular_joe@bigbrother.co',
            userName: 'Regular Joe',
            roles: [Roles.editor, Roles.moderator],
          },
          {
            id: 3,
            email: 'ben@bigbrother.co',
            userName: 'Ben',
            roles: [],
          },
        ],
      });

      res = await request(app.getHttpServer())
        .get('/user')
        .set('authorization', bearer)
        .query({ sort: JSON.stringify(['email']) });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({
        count: 3,
        data: [
          {
            id: 1,
            email: 'admin@tzconnect.com',
            userName: 'admin',
            roles: [Roles.admin],
          },
          {
            id: 3,
            email: 'ben@bigbrother.co',
            userName: 'Ben',
            roles: [],
          },
          {
            id: 2,
            email: 'regular_joe@bigbrother.co',
            userName: 'Regular Joe',
            roles: [Roles.editor, Roles.moderator],
          },
        ],
      });

      res = await request(app.getHttpServer())
        .get('/user')
        .set('authorization', bearer)
        .query({ sort: JSON.stringify(['userName']) });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({
        count: 3,
        data: [
          {
            id: 1,
            email: 'admin@tzconnect.com',
            userName: 'admin',
            roles: [Roles.admin],
          },
          {
            id: 3,
            email: 'ben@bigbrother.co',
            userName: 'Ben',
            roles: [],
          },
          {
            id: 2,
            email: 'regular_joe@bigbrother.co',
            userName: 'Regular Joe',
            roles: [Roles.editor, Roles.moderator],
          },
        ],
      });

      res = await request(app.getHttpServer())
        .get('/user')
        .set('authorization', bearer)
        .query({ sort: JSON.stringify(['roles']) });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({
        count: 3,
        data: [
          {
            id: 3,
            email: 'ben@bigbrother.co',
            userName: 'Ben',
            roles: [],
          },
          {
            id: 1,
            email: 'admin@tzconnect.com',
            userName: 'admin',
            roles: [Roles.admin],
          },
          {
            id: 2,
            email: 'regular_joe@bigbrother.co',
            userName: 'Regular Joe',
            roles: [Roles.editor, Roles.moderator],
          },
        ],
      });
    },
  );
  skipOnPriorFail(
    'users list with non allowed orderBy => BAD REQUEST',
    async () => {
      const { bearer } = await loginUser(
        app,
        'regular_joe@bigbrother.co',
        'somepass',
      );
      let res = await request(app.getHttpServer())
        .get('/user')
        .set('authorization', bearer)
        .query({ sort: JSON.stringify(['some non allowed orderBy string;']) });
      expect(res.statusCode).toEqual(400);

      res = await request(app.getHttpServer())
        .get('/user')
        .set('authorization', bearer)
        .query({ sort: JSON.stringify(['state']) });
      expect(res.statusCode).toEqual(400);
    },
  );

  skipOnPriorFail('/user has filter on username', async () => {
    const { bearer } = await loginUser(
      app,
      'regular_joe@bigbrother.co',
      'somepass',
    );
    const res = await request(app.getHttpServer())
      .get('/user')
      .query({ userName: 'Regular Joe,Ben,Someone that doesnt exist' })
      .set('authorization', bearer);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({
      count: 2,
      data: [
        {
          id: 2,
          email: 'regular_joe@bigbrother.co',
          userName: 'Regular Joe',
          roles: [Roles.editor, Roles.moderator],
        },
        {
          email: 'ben@bigbrother.co',
          id: 3,
          roles: [],
          userName: 'Ben',
        },
      ],
    });
  });

  skipOnPriorFail('/user has filter on user id', async () => {
    const { bearer } = await loginUser(
      app,
      'regular_joe@bigbrother.co',
      'somepass',
    );
    const res = await request(app.getHttpServer())
      .get('/user')
      .query({ id: '2,3,0,-1' })
      .set('authorization', bearer);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({
      count: 2,
      data: [
        {
          id: 2,
          email: 'regular_joe@bigbrother.co',
          userName: 'Regular Joe',
          roles: [Roles.editor, Roles.moderator],
        },
        {
          email: 'ben@bigbrother.co',
          id: 3,
          roles: [],
          userName: 'Ben',
        },
      ],
    });
  });

  skipOnPriorFail('/user has filter on roles', async () => {
    const { bearer } = await loginUser(
      app,
      'regular_joe@bigbrother.co',
      'somepass',
    );
    const res = await request(app.getHttpServer())
      .get('/user')
      .query({ roleIds: Roles.editor })
      .set('authorization', bearer);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({
      count: 1,
      data: [
        {
          id: 2,
          email: 'regular_joe@bigbrother.co',
          userName: 'Regular Joe',
          roles: [Roles.editor, Roles.moderator],
        },
      ],
    });
  });

  skipOnPriorFail('/user multiple filters act as AND (not OR)', async () => {
    const { bearer } = await loginUser(
      app,
      'regular_joe@bigbrother.co',
      'somepass',
    );
    const res = await request(app.getHttpServer())
      .get('/user')
      .query({ userName: 'Regular Joe', roleIds: Roles.admin })
      .set('authorization', bearer);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({
      count: 0,
      data: [],
    });
  });

  skipOnPriorFail(
    'only logged in users can see available categories for assigning to nfts',
    async () => {
      const res = await request(app.getHttpServer()).get(
        '/categories/assignable',
      );
      expect(res.statusCode).toEqual(401);
    },
  );

  skipOnPriorFail('logged in user GET /categories/assignable', async () => {
    const { bearer } = await loginUser(
      app,
      'regular_joe@bigbrother.co',
      'somepass',
    );
    const res = await request(app.getHttpServer())
      .get('/categories/assignable')
      .set('authorization', bearer);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toStrictEqual({
      data: [
        { id: 3, name: 'Applied Art' },
        { id: 4, name: 'Drawing' },
        { id: 5, name: 'Painting' },
        { id: 6, name: 'Sculpture' },
        { id: 7, name: 'Digital' },
        { id: 9, name: 'Abstract' },
        { id: 10, name: 'Landscape' },
        { id: 11, name: 'Portrait' },
        { id: 13, name: 'Honk Kong' },
        { id: 14, name: 'Toronto' },
        { id: 15, name: 'London' },
        { id: 16, name: 'Black & White' },
      ],
    });
  });

  skipOnPriorFail(
    'only logged in admin can access analytics endpoints (part 1; not logged in at all)',
    async () => {
      let res = await request(app.getHttpServer()).get(
        '/analytics/sales/priceVolume/snapshot',
      );
      expect(res.statusCode).toEqual(401);

      res = await request(app.getHttpServer()).get(
        '/analytics/sales/priceVolume/timeseries',
      );
      expect(res.statusCode).toEqual(401);

      res = await request(app.getHttpServer()).get(
        '/analytics/sales/nftCount/snapshot',
      );
      expect(res.statusCode).toEqual(401);

      res = await request(app.getHttpServer()).get(
        '/analytics/sales/nftCount/timeseries',
      );
      expect(res.statusCode).toEqual(401);
    },
  );

  skipOnPriorFail(
    'only logged in admin can access analytics endpoints (part 2; non-admin logged in)',
    async () => {
      const { bearer } = await loginUser(
        app,
        'regular_joe@bigbrother.co',
        'somepass',
      );
      let res = await request(app.getHttpServer())
        .get('/analytics/sales/priceVolume/snapshot')
        .set('authorization', bearer);
      expect(res.statusCode).toEqual(403);

      res = await request(app.getHttpServer())
        .get('/analytics/sales/priceVolume/timeseries')
        .set('authorization', bearer);
      expect(res.statusCode).toEqual(403);

      res = await request(app.getHttpServer())
        .get('/analytics/sales/nftCount/snapshot')
        .set('authorization', bearer);
      expect(res.statusCode).toEqual(403);

      res = await request(app.getHttpServer())
        .get('/analytics/sales/nftCount/timeseries')
        .set('authorization', bearer);
      expect(res.statusCode).toEqual(403);

      res = await request(app.getHttpServer())
        .get('/analytics/activities')
        .set('authorization', bearer);
      expect(res.statusCode).toEqual(403);
    },
  );

  skipOnPriorFail(
    'admin can access analytics endpoints (part 1; before any emulated sales)',
    async () => {
      const { bearer } = await loginUser(
        app,
        'admin@tzconnect.com',
        'supersafepassword',
      );
      let res = await request(app.getHttpServer())
        .get('/analytics/sales/priceVolume/snapshot')
        .set('authorization', bearer);
      expect(res.statusCode).toEqual(200);

      expect(res.body.timestamp).toBeGreaterThan(0);
      delete res.body.timestamp;

      expect(res.body).toStrictEqual({ value: 0 });

      res = await request(app.getHttpServer())
        .get('/analytics/sales/priceVolume/timeseries')
        .set('authorization', bearer);
      expect(res.statusCode).toEqual(200);

      expect(res.body).toStrictEqual({ data: [] });

      res = await request(app.getHttpServer())
        .get('/analytics/sales/nftCount/snapshot')
        .set('authorization', bearer);
      expect(res.statusCode).toEqual(200);

      expect(res.body.timestamp).toBeGreaterThan(0);
      delete res.body.timestamp;

      expect(res.body).toStrictEqual({ value: 0 });

      res = await request(app.getHttpServer())
        .get('/analytics/sales/nftCount/timeseries')
        .set('authorization', bearer);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toStrictEqual({ data: [] });

      res = await request(app.getHttpServer())
        .get('/analytics/activities')
        .set('authorization', bearer);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toStrictEqual({ count: 0, data: [] });
    },
  );

  skipOnPriorFail(
    'analytics endpoints, bad resolution param => BAD REQUEST (part 1: all allowed resolutions)',
    async () => {
      const { bearer } = await loginUser(
        app,
        'admin@tzconnect.com',
        'supersafepassword',
      );

      const snapshotAllowedResolutions = [
        'hour',
        'day',
        'week',
        'month',
        'infinite',
      ];
      const timeseriesAllowedResolutions = ['hour', 'day', 'week', 'month'];
      for (const r of snapshotAllowedResolutions) {
        let res = await request(app.getHttpServer())
          .get('/analytics/sales/priceVolume/snapshot')
          .set('authorization', bearer)
          .query({ resolution: r });
        expect(res.statusCode).toEqual(200);
        res = await request(app.getHttpServer())
          .get('/analytics/sales/nftCount/snapshot')
          .set('authorization', bearer)
          .query({ resolution: r });
        expect(res.statusCode).toEqual(200);
      }

      for (const r of timeseriesAllowedResolutions) {
        let res = await request(app.getHttpServer())
          .get('/analytics/sales/priceVolume/timeseries')
          .set('authorization', bearer)
          .query({ resolution: r });
        expect(res.statusCode).toEqual(200);

        res = await request(app.getHttpServer())
          .get('/analytics/sales/nftCount/timeseries')
          .set('authorization', bearer)
          .query({ resolution: r });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toStrictEqual({ data: [] });
      }
    },
  );

  skipOnPriorFail(
    'analytics endpoints, bad resolution param => BAD REQUEST (part 1: not allowed resolutions)',
    async () => {
      const { bearer } = await loginUser(
        app,
        'admin@tzconnect.com',
        'supersafepassword',
      );

      const snapshotNotAllowedResolutions = ['malicisious', 'something else.;'];
      const timeseriesNotAllowedResolutions = [
        'infinite',
        'malicisious',
        'something else.;',
      ];
      for (const r of snapshotNotAllowedResolutions) {
        let res = await request(app.getHttpServer())
          .get('/analytics/sales/priceVolume/snapshot')
          .set('authorization', bearer)
          .query({ resolution: r });
        expect(res.statusCode).toEqual(400);
        res = await request(app.getHttpServer())
          .get('/analytics/sales/nftCount/snapshot')
          .set('authorization', bearer)
          .query({ resolution: r });
        expect(res.statusCode).toEqual(400);
      }

      for (const r of timeseriesNotAllowedResolutions) {
        let res = await request(app.getHttpServer())
          .get('/analytics/sales/priceVolume/timeseries')
          .set('authorization', bearer)
          .query({ resolution: r });
        expect(res.statusCode).toEqual(400);

        res = await request(app.getHttpServer())
          .get('/analytics/sales/nftCount/timeseries')
          .set('authorization', bearer)
          .query({ resolution: r });
        expect(res.statusCode).toEqual(400);
      }
    },
  );

  skipOnPriorFail('non admin cannot update user roles', async () => {
    const { bearer } = await loginUser(
      app,
      'regular_joe@bigbrother.co',
      'somepass',
    );

    let res = await request(app.getHttpServer())
      .get('/user')
      .query({ userName: 'Regular Joe' })
      .set('authorization', bearer);

    const userId = res.body.data[0].id;

    res = await request(app.getHttpServer())
      .patch(`/user/${userId}`)
      .set('authorization', bearer)
      .send({ roles: [] });
    expect(res.statusCode).toEqual(403);
  });

  skipOnPriorFail('admin can update user roles', async () => {
    const { bearer } = await loginUser(
      app,
      'admin@tzconnect.com',
      'supersafepassword',
    );

    let res = await request(app.getHttpServer())
      .get('/user')
      .query({ userName: 'Regular Joe' })
      .set('authorization', bearer);
    const userId = res.body.data[0].id;

    res = await request(app.getHttpServer())
      .get(`/user/${userId}`)
      .set('authorization', bearer);
    expect(res.body).toEqual({
      id: 2,
      email: 'regular_joe@bigbrother.co',
      userName: 'Regular Joe',
      roles: [Roles.editor, Roles.moderator],
    });

    res = await request(app.getHttpServer())
      .patch(`/user/${userId}`)
      .set('authorization', bearer)
      .send({ roles: [] });
    expect(res.statusCode).toEqual(200);

    res = await request(app.getHttpServer())
      .get(`/user/${userId}`)
      .set('authorization', bearer);
    expect(res.body).toEqual({
      id: 2,
      email: 'regular_joe@bigbrother.co',
      userName: 'Regular Joe',
      roles: [],
    });

    res = await request(app.getHttpServer())
      .patch(`/user/${userId}`)
      .set('authorization', bearer)
      .send({ roles: [Roles.editor, Roles.moderator] });
    expect(res.statusCode).toEqual(200);

    res = await request(app.getHttpServer())
      .get(`/user/${userId}`)
      .set('authorization', bearer);

    expect(res.body).toEqual({
      id: 2,
      email: 'regular_joe@bigbrother.co',
      userName: 'Regular Joe',
      roles: [Roles.editor, Roles.moderator],
    });
  });

  skipOnPriorFail(
    `when updating a user's roles, all new roles must be valid`,
    async () => {
      const { bearer } = await loginUser(
        app,
        'admin@tzconnect.com',
        'supersafepassword',
      );

      let res = await request(app.getHttpServer())
        .get('/user')
        .set('authorization', bearer)
        .query({ userName: 'Regular Joe' });
      const userId = res.body.data[0].id;

      res = await request(app.getHttpServer())
        .patch(`/user/${userId}`)
        .set('authorization', bearer)
        .send({ roles: [Roles.editor, 0] }); // 0 here is an invalid role id
      expect(res.statusCode).toEqual(400);
    },
  );

  skipOnPriorFail('/user/:id requires login', async () => {
    const res = await request(app.getHttpServer()).get('/user/2');
    expect(res.statusCode).toEqual(401);
  });
  skipOnPriorFail('/user requires login', async () => {
    const res = await request(app.getHttpServer()).get('/user');
    expect(res.statusCode).toEqual(401);
  });

  skipOnPriorFail(
    `GET /user/:id of non existing id => BAD REQUEST`,
    async () => {
      const { bearer } = await loginUser(
        app,
        'admin@tzconnect.com',
        'supersafepassword',
      );

      const res = await request(app.getHttpServer())
        .get('/user/0')
        .set('authorization', bearer);
      expect(res.statusCode).toEqual(400);
    },
  );

  skipOnPriorFail(
    'admin can access analytics endpoints (part 2; after emulated sales)',
    async () => {
      await emulateNftSale(
        1,
        [4, 7, 10],
        new Date('December 17, 1995 03:24:00'),
      );
      await emulateNftSale(
        2,
        [2, 27, 11, 10, 4],
        new Date('December 17, 1995 13:24:00'),
      );
      await emulateNftSale(
        1,
        [1, 3, 30],
        new Date('December 17, 1995 13:34:00'),
      );

      const { bearer } = await loginUser(
        app,
        'admin@tzconnect.com',
        'supersafepassword',
      );
      let res = await request(app.getHttpServer())
        .get('/analytics/sales/priceVolume/snapshot')
        .set('authorization', bearer)
        .query({ resolution: 'infinite' });
      expect(res.statusCode).toEqual(200);
      expect(res.body.timestamp).toBeGreaterThan(0);
      delete res.body.timestamp;
      expect(res.body).toStrictEqual({ value: 68 });

      res = await request(app.getHttpServer())
        .get('/analytics/sales/priceVolume/timeseries')
        .set('authorization', bearer)
        .query({ resolution: 'hour' });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toStrictEqual({
        data: [
          { timestamp: 819165600, value: 23.3 },
          { timestamp: 819201600, value: 44.7 },
        ],
      });

      res = await request(app.getHttpServer())
        .get('/analytics/sales/nftCount/snapshot')
        .set('authorization', bearer)
        .query({ resolution: 'infinite' });
      expect(res.statusCode).toEqual(200);
      expect(res.body.timestamp).toBeGreaterThan(0);
      delete res.body.timestamp;
      expect(res.body).toStrictEqual({ value: 11 });

      res = await request(app.getHttpServer())
        .get('/analytics/sales/nftCount/timeseries')
        .set('authorization', bearer)
        .query({ resolution: 'hour' });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toStrictEqual({
        data: [
          { timestamp: 819165600, value: 3 },
          { timestamp: 819201600, value: 8 },
        ],
      });

      res = await request(app.getHttpServer())
        .get('/analytics/activities')
        .set('authorization', bearer);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toStrictEqual({
        data: [
          {
            id: 1,
            timestamp: 819167040,
            kind: 'sale',
            from: null,
            to: 'addr',
            tokenId: 4,
            price: '4.30',
            amount: 1,
          },
          {
            id: 2,
            timestamp: 819167040,
            kind: 'sale',
            from: null,
            to: 'addr',
            tokenId: 7,
            price: '9.80',
            amount: 1,
          },
          {
            id: 3,
            timestamp: 819167040,
            kind: 'sale',
            from: null,
            to: 'addr',
            tokenId: 10,
            price: '9.20',
            amount: 1,
          },
          {
            id: 4,
            timestamp: 819203040,
            kind: 'sale',
            from: null,
            to: 'tz1',
            tokenId: 2,
            price: '7.80',
            amount: 1,
          },
          {
            id: 5,
            timestamp: 819203040,
            kind: 'sale',
            from: null,
            to: 'tz1',
            tokenId: 4,
            price: '4.30',
            amount: 1,
          },
          {
            id: 6,
            timestamp: 819203040,
            kind: 'sale',
            from: null,
            to: 'tz1',
            tokenId: 10,
            price: '9.20',
            amount: 1,
          },
          {
            id: 7,
            timestamp: 819203040,
            kind: 'sale',
            from: null,
            to: 'tz1',
            tokenId: 11,
            price: '4.10',
            amount: 1,
          },
          {
            id: 8,
            timestamp: 819203040,
            kind: 'sale',
            from: null,
            to: 'tz1',
            tokenId: 27,
            price: '1.20',
            amount: 1,
          },
          {
            id: 9,
            timestamp: 819203640,
            kind: 'sale',
            from: null,
            to: 'addr',
            tokenId: 1,
            price: '0.10',
            amount: 1,
          },
          {
            id: 10,
            timestamp: 819203640,
            kind: 'sale',
            from: null,
            to: 'addr',
            tokenId: 3,
            price: '10.40',
            amount: 1,
          },
        ],
        count: 11,
      });
    },
  );

  skipOnPriorFail('NFT test publish to store db', async () => {
    await alignAdminNftNextIdWithStoreNfts();

    const { bearer } = await loginUser(
      app,
      'admin@tzconnect.com',
      'supersafepassword',
    );
    const moderator = await loginUser(
      app,
      'regular_joe@bigbrother.co',
      'somepass',
    );

    let res = await request(app.getHttpServer())
      .patch('/nft')
      .set('authorization', bearer)
      .send({
        name: JSON.stringify('some name'),
        create_ready: JSON.stringify(true),
      });
    expect(res.statusCode).toEqual(200);

    const allowedCategories = await request(app.getHttpServer())
      .get(`/categories/assignable`)
      .set('authorization', bearer);

    const nftId = res.body.id;
    res = await request(app.getHttpServer())
      .patch(`/nft/${nftId}`)
      .set('authorization', bearer)
      .send({
        price: JSON.stringify(105.1),
        categories: JSON.stringify(
          allowedCategories.body.data.map((cat: any) => cat.id).slice(0, 3),
        ),
        editions_size: JSON.stringify(4),
        onsale_from: JSON.stringify(Date.now() + 30 * 60 * 1000),
        proposed: JSON.stringify(true),
      });
    expect(res.statusCode).toEqual(200);

    res = await request(app.getHttpServer())
      .patch(`/nft/${nftId}`)
      .set('authorization', bearer)
      .send({
        publish_vote: JSON.stringify('yes'),
        artifact: JSON.stringify('someuri'),
        thumbnail: JSON.stringify('somethumbnailuri'),
        description: JSON.stringify('some long description'),
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body.state).toEqual('proposed'); // need 2 votes

    res = await request(app.getHttpServer())
      .patch(`/nft/${nftId}`)
      .set('authorization', moderator.bearer)
      .send({
        publish_vote: JSON.stringify('yes'),
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body.state).toEqual('finish');

    const storeNft = await queryStoreDbNft(nftId);
    delete storeNft.nft.created_at;
    delete storeNft.nft.onsale_from;
    delete storeNft.nft.onsale_until;

    expect(storeNft).toStrictEqual({
      nft: {
        id: 35,
        nft_name: 'some name',
        artifact_ipfs: null,
        display_ipfs: null,
        thumbnail_ipfs: null,
        metadata: null,
        metadata_ipfs: null,
        artifact_uri: 'someuri',
        price: '10510', // in cents in the db
        editions_size: 4,
        view_count: 0,
        description: 'some long description',
        display_uri: null,
        thumbnail_uri: 'somethumbnailuri',
        signature:
          'sigXLxpqc2gGdUTb2hgqvwq2mjoAGVY3eY9HBQCQxDTiJ257kbaQ3BxrrM6kC7ppW3K2foNMW44xk5C1wcHh8uStmyFhxjRk',
      },
      categories: [3, 4, 5],
    });
  });

  skipOnPriorFail('NFT test delist from store db', async () => {
    const moderator = await loginUser(
      app,
      'regular_joe@bigbrother.co',
      'somepass',
    );

    const nftId = 35;
    const delistRes = await request(app.getHttpServer())
      .patch(`/nft/${nftId}`)
      .set('authorization', moderator.bearer)
      .send({
        delist_vote: JSON.stringify('yes'),
      });
    expect(delistRes.statusCode).toEqual(200);

    const nftRes = await axios({
      url: process.env['STORE_API'] + `/nfts/${nftId}`,
      method: 'GET',
      validateStatus: () => true,
    });
    expect(nftRes.status).toEqual(400);
  });

  skipOnPriorFail('NFT test relist into store db', async () => {
    const moderator = await loginUser(
      app,
      'regular_joe@bigbrother.co',
      'somepass',
    );

    const nftId = 35;
    const delistRes = await request(app.getHttpServer())
      .patch(`/nft/${nftId}`)
      .set('authorization', moderator.bearer)
      .send({
        relist_vote: JSON.stringify('yes'),
      });
    expect(delistRes.statusCode).toEqual(200);

    const nftRes = await axios({
      url: process.env['STORE_API'] + `/nfts/${nftId}`,
      method: 'GET',
      validateStatus: () => true,
    });
    expect(nftRes.status).toEqual(200);
  });

  skipOnPriorFail(
    'NFT test publish to store db (fails if non valid category assigned)',
    async () => {
      const { bearer } = await loginUser(
        app,
        'admin@tzconnect.com',
        'supersafepassword',
      );
      const moderator = await loginUser(
        app,
        'regular_joe@bigbrother.co',
        'somepass',
      );

      let res = await request(app.getHttpServer())
        .patch('/nft')
        .set('authorization', bearer)
        .send({
          name: JSON.stringify('some name'),
          create_ready: JSON.stringify(true),
        });
      expect(res.statusCode).toEqual(200);

      const allowedCategories = await request(app.getHttpServer())
        .get(`/categories/assignable`)
        .set('authorization', bearer);

      const nftId = res.body.id;
      res = await request(app.getHttpServer())
        .patch(`/nft/${nftId}`)
        .set('authorization', bearer)
        .send({
          price: JSON.stringify(105),
          categories: JSON.stringify(
            [
              ...allowedCategories.body.data
                .map((cat: any) => cat.id)
                .slice(0, 3),
              0,
            ], // 0 here is definitely wrong
          ),
          editions_size: JSON.stringify(4),
          onsale_from: JSON.stringify(Date.now() + 30 * 60 * 1000),
          proposed: JSON.stringify(true),
        });
      expect(res.statusCode).toEqual(200);

      res = await request(app.getHttpServer())
        .patch(`/nft/${nftId}`)
        .set('authorization', bearer)
        .send({
          publish_vote: JSON.stringify('yes'),
          artifact: JSON.stringify('someuri'),
          thumbnail: JSON.stringify('somethumbnailuri'),
          description: JSON.stringify('some long description'),
        });
      expect(res.statusCode).toEqual(200); // need 2 votes

      res = await request(app.getHttpServer())
        .patch(`/nft/${nftId}`)
        .set('authorization', moderator.bearer)
        .send({
          publish_vote: JSON.stringify('yes'),
        });
      expect(res.statusCode).toEqual(500);
    },
  );

  skipOnPriorFail('NFT test voting behavior', async () => {
    const { bearer } = await loginUser(
      app,
      'admin@tzconnect.com',
      'supersafepassword',
    );
    const moderator = await loginUser(
      app,
      'regular_joe@bigbrother.co',
      'somepass',
    );

    let res = await request(app.getHttpServer())
      .patch('/nft')
      .set('authorization', bearer)
      .send({
        name: JSON.stringify('some name'),
        create_ready: JSON.stringify(true),
      });
    expect(res.statusCode).toEqual(200);

    const allowedCategories = await request(app.getHttpServer())
      .get(`/categories/assignable`)
      .set('authorization', bearer);

    const nftId = res.body.id;
    res = await request(app.getHttpServer())
      .patch(`/nft/${nftId}`)
      .set('authorization', bearer)
      .send({
        price: JSON.stringify(105),
        categories: JSON.stringify([
          ...allowedCategories.body.data.map((cat: any) => cat.id).slice(0, 3),
        ]),
        editions_size: JSON.stringify(4),
        onsale_from: JSON.stringify(Date.now() + 30 * 60 * 1000),
        proposed: JSON.stringify(true),
      });
    expect(res.statusCode).toEqual(200);

    res = await request(app.getHttpServer())
      .patch(`/nft/${nftId}`)
      .set('authorization', bearer)
      .send({
        publish_vote: JSON.stringify('yes'),
        artifact: JSON.stringify('someuri'),
        thumbnail: JSON.stringify('somethumbnailuri'),
        description: JSON.stringify('some long description'),
      });
    expect(res.statusCode).toEqual(200); // need 2 votes

    // allowed to 'unvote' by passing null
    res = await request(app.getHttpServer())
      .patch(`/nft/${nftId}`)
      .set('authorization', bearer)
      .send({
        publish_vote: null,
      });
    expect(res.statusCode).toEqual(200);

    res = await request(app.getHttpServer())
      .patch(`/nft/${nftId}`)
      .set('authorization', bearer)
      .send({
        publish_vote: JSON.stringify('yes'),
      });
    expect(res.statusCode).toEqual(200);

    // allowed to vote no when having a yes active (negates the yes and adds to the no tally)
    res = await request(app.getHttpServer())
      .patch(`/nft/${nftId}`)
      .set('authorization', bearer)
      .send({
        publish_vote: JSON.stringify('no'),
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body.state).toEqual('setup_nft');
  });

  skipOnPriorFail('non admin cannot remove users', async () => {
    const { bearer } = await loginUser(
      app,
      'regular_joe@bigbrother.co',
      'somepass',
    );

    let res = await request(app.getHttpServer())
      .get('/user')
      .query({ userName: 'Regular Joe' })
      .set('authorization', bearer);
    const userId = res.body.data[0].id;

    res = await request(app.getHttpServer())
      .delete(`/user/${userId}`)
      .set('authorization', bearer);
    expect(res.statusCode).toEqual(403);
  });

  skipOnPriorFail('admin can remove users', async () => {
    const { bearer } = await loginUser(
      app,
      'admin@tzconnect.com',
      'supersafepassword',
    );

    let res = await request(app.getHttpServer())
      .get('/user')
      .query({ userName: 'Regular Joe' })
      .set('authorization', bearer);
    const userId = res.body.data[0].id;

    res = await request(app.getHttpServer())
      .delete(`/user/${userId}`)
      .set('authorization', bearer);
    expect(res.statusCode).toEqual(200);
  });

  skipOnPriorFail('GET /nft/attributes', async () => {
    const { bearer } = await loginUser(
      app,
      'admin@tzconnect.com',
      'supersafepassword',
    );

    const res = await request(app.getHttpServer())
      .get('/nft/attributes')
      .set('authorization', bearer);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toStrictEqual({
      name: 'string',
      create_ready: 'boolean',
      delist_vote: 'votes',
      description: 'string',
      artifact: 'string',
      thumbnail: 'string',
      price: 'number',
      editions_size: 'number',
      onsale_from: 'date',
      categories: 'number[]',
      proposed: 'boolean',
      publish_vote: 'votes',
      relist_vote: 'votes',
    });
  });

  skipOnPriorFail('GET /nft/attributes requires logged in user', async () => {
    const res = await request(app.getHttpServer()).get('/nft/attributes');
    expect(res.statusCode).toEqual(401);
  });
});

function newDbConn() {
  return new Pool({
    host: assertEnv('PGHOST'),
    port: Number(assertEnv('PGPORT')),
    user: assertEnv('PGUSER'),
    password: assertEnv('PGPASSWORD'),
    database: assertEnv('PGDATABASE'),
  });
}
function newStoreReplConn() {
  return new Pool({
    host: assertEnv('PGHOST'),
    port: Number(assertEnv('PGPORT')),
    user: assertEnv('PGUSER'),
    password: assertEnv('PGPASSWORD'),
    database: 'store_replication',
  });
}

async function emulateNftSale(userId: number, nftIds: number[], at: Date) {
  const storeRepl = newStoreReplConn();
  const qryRes = await storeRepl.query(
    `
INSERT INTO nft_order (
  user_id, order_at, expires_at
)
VALUES ($1, $2, now())
RETURNING id
    `,
    [userId, at.toUTCString()],
  );

  const orderId = qryRes.rows[0]['id'];

  await storeRepl.query(
    `
INSERT INTO mtm_nft_order_nft (
  nft_order_id, nft_id
)
SELECT $1, UNNEST($2::INTEGER[])
    `,
    [orderId, nftIds],
  );

  await storeRepl.query(
    `
INSERT INTO payment (
  payment_id, status, nft_order_id, provider, currency, amount
)
VALUES ('bla', 'succeeded', $1, 'test_provider', 'EUR', 4.45)
    `,
    [orderId],
  );

  await storeRepl.end();
}

async function queryStoreDbNft(nftId: number) {
  const storeRepl = newStoreReplConn();
  const qryRes = await storeRepl.query(
    `
SELECT *
FROM nft
WHERE id = $1`,
    [nftId],
  );
  const qryResCats = await storeRepl.query(
    `
SELECT nft_category_id
FROM mtm_nft_category
WHERE nft_id = $1
ORDER BY 1`,
    [nftId],
  );

  await storeRepl.end();
  return {
    nft: qryRes.rows[0],
    categories: qryResCats.rows.map((row: any) => row['nft_category_id']),
  };
}

async function alignAdminNftNextIdWithStoreNfts() {
  const db = newDbConn();
  const storeRepl = newStoreReplConn();
  const qryRes = await storeRepl.query(
    `
SELECT MAX(id) as max_id FROM nft
    `,
    [],
  );

  const setLastId = qryRes.rows[0]['max_id'];

  await db.query(
    `
SELECT setval('nft_id_seq', $1)
    `,
    [setLastId],
  );
  await storeRepl.end();
  await db.end();
}

async function loginUser(
  app: INestApplication,
  email: string,
  password: string,
): Promise<{ bearer: string; email: string }> {
  const login = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ username: email, password: password });
  expect(login.statusCode).toEqual(201);

  return {
    bearer: `Bearer ${login.body.accessToken}`,
    email: email,
  };
}
