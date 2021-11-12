import { Module } from '@nestjs/common'
import { UserController } from './controller/user.controller'
import { UserService } from './service/user.service'
import { DbModule } from 'src/db.module'

@Module({
  imports: [DbModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
