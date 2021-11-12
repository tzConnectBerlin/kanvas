import {
  Logger,
  HttpStatus,
  HttpException,
  Injectable,
  Inject,
} from '@nestjs/common'
import { CategoryEntity } from '../entity/category.entity'
import { PG_CONNECTION } from '../../constants'

@Injectable()
export class CategoryService {
  constructor(@Inject(PG_CONNECTION) private conn: any) {}

  async create(_category: CategoryEntity): Promise<CategoryEntity> {
    throw new Error('Not implemented yet')
  }

  async findAll(): Promise<CategoryEntity[]> {
    try {
      const categoriesQryRes = await this.conn.query(
        `
SELECT id, category, description, parent
FROM nft_category
ORDER BY COALESCE(parent, 0) DESC, id`,
        [],
      )
      return categoriesQryRes.rows.map(
        (row: any) =>
          <CategoryEntity>{
            id: row['id'],
            name: row['category'],
            description: row['description'],
            parent: row['parent'],
          },
      )
      throw new Error('Not implemented yet')
    } catch (err) {
      Logger.error('Error on get categories query, err: ' + err)
      throw new HttpException(
        'Something went wrong',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }
}
