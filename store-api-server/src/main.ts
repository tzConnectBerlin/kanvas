import dotenv from 'dotenv';
dotenv.config();

import body_parser from 'body-parser';
const { raw } = body_parser;
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const port = process.env['KANVAS_API_PORT'] || 3000;

  const app = await NestFactory.create(AppModule, {
    cors: process.env.LOCAL_CORS === 'true',
    logger: ['log', 'warn', 'error'],
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.use('/payment/stripe-webhook', raw({ type: 'application/json' }));
  app.enableShutdownHooks();

  await app.listen(port);
  console.log('Listening on ', port);
}
bootstrap();
