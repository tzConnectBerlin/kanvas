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

  /**
   * @apiGroup Categories
   * @api {get} /categories Get all categories.
   * @apiSuccessExample Example Success-Response:
   *  [
   *    {
   *         "id": 1,
   *         "name": "Survival",
   *         "description": "The Survival videos reflect microscopic iterations of the big bang. [...]"
   *         "metadata": {
   *             "contentType": "video",
   *             "categoryImageUri": "https://kanvas-sv-nfts.s3.eu-central-1.amazonaws.com/survival-019-display.png"
   *         },
   *         "children": []
   *     },
   *     ...
   *  ]
   * @apiName getCategories
   */
  @Get()
  async getCategories(@Res() resp: Response) {
    return await wrapCache(this.cache, resp, 'categories.categories', () => {
      return this.categoryService.categories();
    });
  }

  /**
   * @apiGroup Categories
   * @api {get} /categories/extendedInfo Get all categories with extended info.
   * @apiSuccessExample Example Success-Response:
   *  {
   *    "categories": [
   *      {
   *             "id": 1,
   *             "name": "Fine Art",
   *             "description": "A collection of fine art devided in several categories",
   *             "metadata": null,
   *             "children": [
   *                 {
   *                     "id": 4,
   *                     "name": "Drawing",
   *                     "description": "Sub fine art category",
   *                     "metadata": null,
   *                     "children": []
   *                 },
   *                 {
   *                     "id": 5,
   *                     "name": "Painting",
   *                     "description": "Sub fine art category",
   *                     "metadata": null,
   *                     "children": []
   *                 },
   *                 {
   *                     "id": 6,
   *                     "name": "Sculpture",
   *                     "description": "Sub fine art category",
   *                     "metadata": null,
   *                     "children": []
   *                 }
   *             ]
   *         },
   *         ...
   *    ],
   *    "info": {
   *         "3": {
   *             "totalNftCount": 1,
   *             "unavailableNftCount": 1
   *         },
   *         "4": {
   *             "totalNftCount": 2,
   *             "unavailableNftCount": 1
   *         },
   *         ...
   *     }
   *  }
   * @apiName getCategoriesExtendedInfo
   */
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
