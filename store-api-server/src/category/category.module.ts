import { Module } from '@nestjs/common';
import { CategoryController } from './controller/category.controller.js';
import { CategoryService } from './service/category.service.js';
import { DbModule } from '../db.module.js';
import { NftModule } from '../nft/nft.module.js';

@Module({
  imports: [DbModule, NftModule],
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class CategoryModule {}
