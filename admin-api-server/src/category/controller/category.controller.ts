import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard.js';
import { CategoryEntity } from '../../category/entity/category.entity.js';
import { CategoryService } from '../service/category.service.js';

@Controller('categories')
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @Get('/assignable')
  @UseGuards(JwtAuthGuard)
  async nftAssignable(): Promise<{ data: CategoryEntity[] }> {
    return { data: await this.categoryService.getNftAssignable() };
  }
}
