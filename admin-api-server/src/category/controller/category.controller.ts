import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CategoryEntity } from '../../category/entity/category.entity';
import { CategoryService } from '../service/category.service';

interface FilterCategory {
  id?: number[]
}

@Controller('categories')
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @Get('/assignable')
  async nftAssignable(): Promise<{ data: CategoryEntity[] }> {
    return { data: await this.categoryService.getNftAssignable()};
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Query('filter') filters?: string,
  ): Promise<{ data: CategoryEntity[] }> {
    return { data: await this.categoryService.getCategories(JSON.parse(filters).id)};
  }
}
