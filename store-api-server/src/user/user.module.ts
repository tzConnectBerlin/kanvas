import { Module } from '@nestjs/common';
import { UserController } from './controller/user.controller';
import { UserService } from './service/user.service';
import { NftService } from 'src/nft/service/nft.service';
import { DbModule } from 'src/db.module';
import { MintService } from 'src/nft/service/mint.service';
import { S3Service } from 'src/s3.service';

@Module({
  imports: [DbModule],
  controllers: [UserController],
  providers: [NftService, UserService, S3Service, MintService],
})
export class UserModule {}
