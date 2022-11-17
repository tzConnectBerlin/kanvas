import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard.js';
import { CategoryEntity } from '../../category/entity/category.entity.js';
import { CategoryService } from '../service/category.service.js';

@Controller('categories')
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  /**
   * @apiGroup Categories
   * @api {get} /categories/assignable Request nft categories
   * @apiPermission user
   *
   * @apiSuccessExample Example Success-Response:
   *    {
   *        "data": [
   *            {
   *             "id": 3,
   *             "name": "Applied Art"
   *            },
   *            {
   *             "id": 4,
   *             "name": "Drawing"
   *            },
   *            {
   *             "id": 5,
   *             "name": "Painting"
   *            },
   *            ...
   *        ]
   *    }
   * @apiName nftAssignable
   */
  @Get('/assignable')
  @UseGuards(JwtAuthGuard)
  async nftAssignable(): Promise<{ data: CategoryEntity[] }> {
    return { data: await this.categoryService.getNftAssignable() };
  }
}
