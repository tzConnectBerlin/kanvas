import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { BEHIND_PROXY } from './constants';
import { NestExpressApplication } from '@nestjs/platform-express';

var bodyParser = require('body-parser');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: process.env.LOCAL_CORS === 'true',
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
