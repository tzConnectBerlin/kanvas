import { Module } from '@nestjs/common';
import { UserController } from './controller/user.controller.js';
import { UserService } from './service/user.service.js';
import { DbModule } from '../db.module.js';
import { NftModule } from '../nft/nft.module.js';
import { CategoryService } from '../category/service/category.service.js';
import { S3Service } from '../s3.service.js';
import { CurrencyModule } from 'kanvas-api-lib';

@Module({
  imports: [DbModule, NftModule, CurrencyModule],
  controllers: [UserController],
  providers: [CategoryService, UserService, S3Service],
  exports: [UserService],
})
export class UserModule {}
