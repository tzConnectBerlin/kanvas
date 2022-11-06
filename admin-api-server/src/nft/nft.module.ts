import { Module } from '@nestjs/common';
import { NftService } from './service/nft.service.js';
import { NftController } from './controller/nft.controller.js';
import { DbModule } from '../db.module.js';
import { S3Service } from './service/s3.service.js';
import { CategoryModule } from '../category/category.module.js';
import { RoleModule } from '../role/role.module.js';
import { FileService } from './service/file.service.js';

@Module({
  imports: [DbModule, CategoryModule, RoleModule],
  controllers: [NftController],
  providers: [S3Service, NftService, FileService],
})
export class NftModule {}
