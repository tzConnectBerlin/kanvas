import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

var bodyParser = require('body-parser')
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  const port = process.env['ADMIN_API_PORT'] || 3001;
  app.use(bodyParser.json({
    limit: '2mb'
  }));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(port);
  console.log('Listening on ', port);
}
bootstrap();
