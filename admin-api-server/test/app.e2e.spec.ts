import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { Roles } from 'src/role/role.entity';

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
    await app.init();
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
        address: 'tz1bla',
        password: 'somepass',
        roles: [Roles.editor],
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toStrictEqual({
      id: 2,
      roles: [Roles.editor],
      email: 'regular_joe@bigbrother.co',
      userName: 'Regular Joe',
      address: 'tz1bla',
    });
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
      expect(res.body).toStrictEqual({ data: [] });
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
      expect(res.body.updatedAt).toEqual(res.body.createdAt);
      delete res.body.createdAt;
      delete res.body.updatedAt;

      expect(res.body).toStrictEqual({
        id: 1,
        state: 'creation',
        createdBy: 1,
        attributes: {},
        allowedActions: { name: 'string', create_ready: 'boolean' },
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
      expect(res.body.updatedAt).toEqual(res.body.createdAt);
      delete res.body.createdAt;
      delete res.body.updatedAt;

      expect(res.body).toStrictEqual({
        id: 2,
        state: 'creation',
        createdBy: 1,
        attributes: { name: 'test' },
        allowedActions: { name: 'string', create_ready: 'boolean' },
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
      expect(res.body.updatedAt).toEqual(res.body.createdAt);
      delete res.body.createdAt;
      delete res.body.updatedAt;

      expect(res.body).toStrictEqual({
        id: 2,
        state: 'creation',
        createdBy: 1,
        attributes: { name: 'test' },
        allowedActions: { name: 'string', create_ready: 'boolean' },
      });

      const joe = await loginUser(app, 'regular_joe@bigbrother.co', 'somepass');

      res = await request(app.getHttpServer())
        .get('/nft/2')
        .set('authorization', joe.bearer); // Admin was creator of nft/2
      expect(res.statusCode).toEqual(200);

      expect(res.body.createdAt).toBeGreaterThan(0);
      expect(res.body.updatedAt).toEqual(res.body.createdAt);
      delete res.body.createdAt;
      delete res.body.updatedAt;

      expect(res.body).toStrictEqual({
        id: 2,
        state: 'creation',
        createdBy: 1,
        attributes: { name: 'test' },
        allowedActions: {},
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
    'NFT cannot be removed by anyone else than the creator',
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
        .delete(`/nft/${nftId}`)
        .set('authorization', admin.bearer);
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
        address: 'tz1ben',
        password: 'somepass',
        roles: [],
      });
    expect(res.statusCode).toEqual(201);
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
        address: 'tz1hank',
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
        address: 'tz1blb',
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
      data: [
        {
          id: 1,
          email: 'admin@tzconnect.com',
          userName: 'admin',
          address: 'tz1Ke2h7sDdakHJQh8WX4Z372du1KChsksyU',
          roles: [Roles.admin],
        },
        {
          id: 2,
          email: 'regular_joe@bigbrother.co',
          userName: 'Regular Joe',
          address: 'tz1bla',
          roles: [Roles.editor],
        },
        {
          id: 3,
          email: 'ben@bigbrother.co',
          userName: 'Ben',
          address: 'tz1ben',
          roles: [],
        },
      ],
    });
  });

  skipOnPriorFail('/user has filter on username', async () => {
    const { bearer } = await loginUser(
      app,
      'regular_joe@bigbrother.co',
      'somepass',
    );
    const res = await request(app.getHttpServer())
      .get('/user')
      .query({ userName: 'Regular Joe' })
      .set('authorization', bearer);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({
      data: [
        {
          id: 2,
          email: 'regular_joe@bigbrother.co',
          userName: 'Regular Joe',
          address: 'tz1bla',
          roles: [Roles.editor],
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
      data: [
        {
          id: 2,
          email: 'regular_joe@bigbrother.co',
          userName: 'Regular Joe',
          address: 'tz1bla',
          roles: [Roles.editor],
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
      .query({ userName: 'Regular Joe', roleIds: Roles.moderator })
      .set('authorization', bearer);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({
      data: [],
    });
  });

  skipOnPriorFail(
    'only logged in users can see available categories for assigning to nfts',
    async () => {
      const res = await request(app.getHttpServer()).get('/categories');
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
      address: 'tz1bla',
      roles: [Roles.editor],
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
      address: 'tz1bla',
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
      address: 'tz1bla',
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
});

async function emulateNftSale() {}

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
