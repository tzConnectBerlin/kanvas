import body_parser from 'body-parser';
const { raw } = body_parser;
import { NestFactory } from '@nestjs/core';
import { NestApplicationOptions } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { BEHIND_PROXY, LOCAL_CORS } from './constants.js';
import bodyParser from 'body-parser';

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

  // Hide JSON parsing errors from user
  server.use(bodyParser.json())
  server.use((err:any, req:any, res:any, next:any) => {
    if (err.status >= 400 && err.status < 500 &&
      err.message.indexOf('JSON') !== -1) {
        res.status(422).send()
    }
  })

  server.enableShutdownHooks();
}
