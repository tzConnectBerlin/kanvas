import body_parser from 'body-parser';
const { raw } = body_parser;
import { NestFactory } from '@nestjs/core';
import { NestApplicationOptions } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { BEHIND_PROXY, LOCAL_CORS } from './constants.js';

export async function runKanvasServer() {
  const server = await NestFactory.create<NestExpressApplication>(
    AppModule,
    kanvasNestOptions(),
  );
  setupKanvasServer(server);

  const port = process.env['KANVAS_API_PORT'] || 3000;
  await server.listen(port);
  console.log('Listening on ', port);
}

export function kanvasNestOptions(): NestApplicationOptions {
  let cors: any = false;
  if (LOCAL_CORS) {
    cors = {
      credentials: true,
      origin: true,
    };
  }

  return {
    cors: cors,
    logger: ['log', 'warn', 'error'],
  };
}

export function setupKanvasServer(server: NestExpressApplication) {
  server.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  server.use('/payment/stripe-webhook', raw({ type: 'application/json' }));
  if (BEHIND_PROXY) {
    server.set('trust proxy', 1);
  }

  server.enableShutdownHooks();
}
