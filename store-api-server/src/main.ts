require('dotenv').config();

import { raw } from 'body-parser';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { Sotez } from 'sotez';

const tezos = new Sotez('https://testnet-tezos.giganode.io');

async function bootstrap() {
  const port = process.env['KANVAS_API_PORT'] || 3000;

  const app = await NestFactory.create(AppModule, {
    cors: process.env.LOCAL_CORS === 'true',
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.use('/payment/stripe-webhook', raw({ type: 'application/json' }));

  await app.listen(port);
  console.log('Listening on ', port);
}
bootstrap();
