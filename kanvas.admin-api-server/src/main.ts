import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import * as cookieSession from 'cookie-session'
import { assertEnv } from './utils'
import { v4 as uuidv4 } from 'uuid'
require('dotenv').config()

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true })
  app.use(
    cookieSession({
      secret: assertEnv('JWT_SECRET'),
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    }),
  )
  app.use(function (req: any, _res: any, next: any) {
    if (typeof req.session.uuid === 'undefined') {
      req.session.uuid = uuidv4()
    }
    next()
  })
  const port = process.env['KANVAS_API_PORT'] || 3001
  await app.listen(port)
  console.log('Listening on ', port)
}
bootstrap()
