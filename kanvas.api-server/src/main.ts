require('dotenv').config()

import { v4 as uuidv4 } from 'uuid'
import cookieSession = require('cookie-session')
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true })
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
  app.use(
    cookieSession({
      secret: 'very-secret',

      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    }),
  )
  app.use(function (req: any, res: any, next: any) {
    if (typeof req.session.uuid === 'undefined') {
      req.session.uuid = uuidv4()
    }
    next()
  })
  await app.listen(process.env['KANVAS_API_PORT'] || 3000)
}
bootstrap()
