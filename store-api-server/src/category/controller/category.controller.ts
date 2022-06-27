import { Controller, Get, CACHE_MANAGER, Res, Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Response } from 'express';
import { wrapCache } from '../../utils.js';
import { CategoryService } from '../service/category.service.js';

@Controller('categories')
export class CategoryController {
  constructor(
    private categoryService: CategoryService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  @Get()
  async getCategories(@Res() resp: Response) {
    return await wrapCache(this.cache, resp, 'categories.categories', () => {
      return this.categoryService.categories();
    });
  }

  @Get('/extendedInfo')
  async getCategoriesExtendedInfo(@Res() resp: Response) {
    return await wrapCache(
      this.cache,
      resp,
      'categories.categoriesExtendedInfo',
      () => {
        return this.categoryService.categoriesExtendedInfo();
      },
    );
  }
}
