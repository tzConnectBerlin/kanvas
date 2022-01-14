import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  const port = process.env['ADMIN_API_PORT'] || 3001;
  await app.listen(port);
  console.log('Listening on ', port);
}
bootstrap();
