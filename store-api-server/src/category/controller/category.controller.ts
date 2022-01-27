import { Body, Controller, Get, Post } from '@nestjs/common';
import { CategoryEntity } from '../../category/entity/category.entity';
import { CategoryService } from '../service/category.service';

@Controller('categories')
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @Get()
  async findAll(): Promise<CategoryEntity[]> {
    return this.categoryService.findAll();
  }
}
