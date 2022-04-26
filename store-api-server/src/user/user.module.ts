import { Module } from '@nestjs/common';
import { UserController } from './controller/user.controller';
import { UserService } from './service/user.service';
import { DbModule } from 'src/db.module';
import { NftModule } from 'src/nft/nft.module';
import { CategoryService } from 'src/category/service/category.service';
import { S3Service } from 'src/s3.service';

@Module({
  imports: [DbModule, NftModule],
  controllers: [UserController],
  providers: [CategoryService, UserService, S3Service],
  exports: [UserService],
})
export class UserModule {}
