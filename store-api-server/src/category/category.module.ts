import { Module } from '@nestjs/common';
import { CategoryController } from './controller/category.controller.js';
import { CategoryService } from './service/category.service.js';
import { DbModule } from '../db.module.js';

@Module({
  imports: [DbModule],
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class CategoryModule {}
