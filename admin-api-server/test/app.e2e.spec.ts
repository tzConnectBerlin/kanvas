import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
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
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
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
        password: 'root',
        roles: [],
      });
    expect(res.statusCode).toEqual(201);
  });
});

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
