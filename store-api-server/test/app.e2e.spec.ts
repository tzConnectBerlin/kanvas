import { Test, TestingModule } from '@nestjs/testing';
import { Logger, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should be defined', () => expect(app).toBeDefined());

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  // Note:
  // - these tests expect responses related to a database that has been filled
  //   with data in store-api-server/script/populate-testdb.sql

  it('/users/profile: not logged in and no userAddress provided => BAD REQUEST', async () => {
    const res = await request(app.getHttpServer()).get('/users/profile');
    expect(res.statusCode).toEqual(400);
  });

  it('/users/profile: non existing userAddress provided => BAD REQUEST', async () => {
    const res = await request(app.getHttpServer())
      .get('/users/profile')
      .query({ userAddress: 'nonsense address' });
    expect(res.statusCode).toEqual(400);
  });

  it('/users/profile: existing userAddress provided => OK', async () => {
    const res = await request(app.getHttpServer())
      .get('/users/profile')
      .query({ userAddress: 'addr' });
    expect(res.statusCode).toEqual(200);

    // cannot test this accurately because currently the testdb is populated
    // with now() timestamps
    expect(res.body.user?.createdAt).toBeGreaterThan(0);
    delete res.body.user?.createdAt;

    expect(res.body).toStrictEqual({
      nftCount: 0,
      user: {
        id: 1,
        userName: 'admin',
        userAddress: 'addr',
        profilePicture: null,
        roles: [],
      },
    });
  });

  it('/users/profile: no userAddress provied and logged in => OK, return profile of logged in user', async () => {
    const bearer = await loginUser(app, 'addr', 'admin');

    // const cookie = login.headers['set-cookie'];
    // console.log(cookie);

    const res = await request(app.getHttpServer())
      .get('/users/profile')
      .set('authorization', bearer);
    expect(res.statusCode).toEqual(200);

    // cannot test this accurately because currently the testdb is populated
    // with now() timestamps
    expect(res.body.user?.createdAt).toBeGreaterThan(0);
    delete res.body.user?.createdAt;

    expect(res.body).toStrictEqual({
      nftCount: 0,
      user: {
        id: 1,
        userName: 'admin',
        userAddress: 'addr',
        profilePicture: null,
        roles: [],
      },
    });
  });

  it('/users/profile: userAddress provied and logged in => OK, return profile of provided userAddress', async () => {
    const bearer = await loginUser(app, 'addr', 'admin');

    // const cookie = login.headers['set-cookie'];
    // console.log(cookie);

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
      nftCount: 0,
      user: {
        id: 2,
        userName: 'test user',
        userAddress: 'tz1',
        profilePicture: null,
        roles: [],
      },
    });
  });

  it('/users/cart (logged in)', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ userAddress: 'addr', signedPayload: 'admin' });
    expect(login.statusCode).toEqual(201);

    const add1 = await request(app.getHttpServer()).post('/users/cart/add/4');
    expect(add1.statusCode).toEqual(201);

    const add2 = await request(app.getHttpServer()).post('/users/cart/add/12');
    expect(add2.statusCode).toEqual(201);

    const list = await request(app.getHttpServer()).post('/users/cart/list');
    expect(list.statusCode).toEqual(201);

    console.log(JSON.stringify(list.body));
  });
});

async function loginUser(
  app: INestApplication,
  address: string,
  password: string,
): Promise<string> {
  const login = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ userAddress: 'addr', signedPayload: 'admin' });
  expect(login.statusCode).toEqual(201);

  return `Bearer ${login.body.token}`;
}
