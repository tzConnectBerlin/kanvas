import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export async function loginAsAdmin(
  app: INestApplication,
): Promise<{ bearer: string; email: string }> {
  return loginUser(app, 'admin@tzconnect.com', 'supersafepassword');
}

export async function loginUser(
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
