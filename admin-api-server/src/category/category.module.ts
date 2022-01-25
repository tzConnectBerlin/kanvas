import { Module } from '@nestjs/common';
import { CategoryController } from './controller/category.controller';
import { CategoryService } from './service/category.service';
import { DbModule } from 'src/db.module';

@Module({
  imports: [DbModule],
  controllers: [CategoryController],
  providers: [CategoryService],
})
export class CategoryModule {}
