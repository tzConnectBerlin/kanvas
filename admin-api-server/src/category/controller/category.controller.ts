import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { CategoryEntity } from '../../category/entity/category.entity';
import { CategoryService } from '../service/category.service';

@Controller('categories')
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @Get('/assignable')
  @UseGuards(JwtAuthGuard)
  async nftAssignable(): Promise<{ data: CategoryEntity[] }> {
    return { data: await this.categoryService.getNftAssignable() };
  }
}
