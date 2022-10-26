import 'dotenv/config';

import body_parser from 'body-parser';
const { raw } = body_parser;
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { BEHIND_PROXY } from './constants.js';
import { TokenGate } from 'token-gate';
import { expressjwt, ExpressJwtRequest } from 'express-jwt';
import { assertEnv } from './utils.js';

async function bootstrap() {
  const port = process.env['KANVAS_API_PORT'] || 3000;

  let cors: any = false;
  if (process.env.LOCAL_CORS === 'true') {
    cors = {
      credentials: true,
      origin: true,
    };
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: cors,
    logger: ['log', 'warn', 'error'],
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.use('/payment/stripe-webhook', raw({ type: 'application/json' }));
  if (BEHIND_PROXY) {
    app.set('trust proxy', 1);
  }

  app.use(
    expressjwt({
      secret: assertEnv('JWT_SECRET'),
      algorithms: ['HS256'],
      credentialsRequired: false,
    }),
  );

  app.enableShutdownHooks();

  await app.listen(port);
  console.log('Listening on ', port);
}
bootstrap();
