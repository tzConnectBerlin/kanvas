import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { BEHIND_PROXY } from './constants.js';
import { NestExpressApplication } from '@nestjs/platform-express';

import bodyParser from 'body-parser';

async function bootstrap() {
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
  app.use(
    bodyParser.json({
      limit: '2mb',
    }),
  );
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  if (BEHIND_PROXY) {
    app.set('trust proxy', 1);
  }
  app.enableShutdownHooks();

  const port = process.env['ADMIN_API_PORT'] || 3001;
  await app.listen(port);
  console.log('Listening on ', port);
}
bootstrap();
