import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { config } from 'dotenv'

async function bootstrap() {
  config()
  const app = await NestFactory.create(AppModule, { cors: true })
  await app.listen(process.env['KANVAS_API_PORT'] || 3000)
}
bootstrap()
