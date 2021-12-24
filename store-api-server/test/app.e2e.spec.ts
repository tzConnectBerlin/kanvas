import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
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
});
