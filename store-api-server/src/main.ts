require('dotenv').config()

import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {cors: process.env.LOCAL_CORS === 'true' })
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
  await app.listen(process.env['KANVAS_API_PORT'] || 3000)
}
bootstrap()
