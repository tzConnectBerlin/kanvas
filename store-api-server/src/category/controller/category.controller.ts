import { Controller, Get, CACHE_MANAGER, Res, Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Response } from 'express';
import { wrapCache } from 'src/utils';
import { CategoryService } from '../service/category.service';

@Controller('categories')
export class CategoryController {
  constructor(
    private categoryService: CategoryService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  @Get()
  async findAll(@Res() resp: Response) {
    return await wrapCache(this.cache, resp, 'categories.findAll', () => {
      return this.categoryService.findAll();
    });
  }
}
