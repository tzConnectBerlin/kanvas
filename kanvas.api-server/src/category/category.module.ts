import { Module } from '@nestjs/common'
import { CategoryController } from './controller/category.controller'
import { CategoryService } from './service/category.service'

@Module({
  imports: [],
  controllers: [CategoryController],
  providers: [CategoryService],
})
export class CategoryModule {}
