import { Module } from '@nestjs/common'
import { UserController } from './controller/user.controller'
import { UserService } from './service/user.service'
import { NftService } from 'src/nft/service/nft.service'
import { DbModule } from 'src/db.module'

@Module({
  imports: [DbModule],
  controllers: [UserController],
  providers: [NftService, UserService],
})
export class UserModule {}
