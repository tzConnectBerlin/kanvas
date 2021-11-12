import { Body, Controller, Get, Post } from '@nestjs/common'
import { CategoryEntity } from '../../category/entity/category.entity'
import { CategoryService } from '../service/category.service'
require('dotenv').config()

@Controller('categories')
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @Post()
  async create(@Body() user: CategoryEntity): Promise<CategoryEntity> {
    return this.categoryService.create(user)
  }

  @Get()
  async findAll(): Promise<CategoryEntity[]> {
    return this.categoryService.findAll()
  }
}
