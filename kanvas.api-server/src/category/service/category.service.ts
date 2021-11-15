import {
  Logger,
  HttpStatus,
  HttpException,
  Injectable,
  Inject,
} from '@nestjs/common'
import { CategoryEntity } from '../entity/category.entity'
import { PG_CONNECTION } from '../../constants'

interface CategoryQueryResponse {
  id: number
  category: string
  description: string
  parent: number | undefined
}

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
      return this.categoriesQryRespToEntities(categoriesQryRes.rows)
    } catch (err) {
      Logger.error('Error on get categories query, err: ' + err)
      throw new HttpException(
        'Something went wrong',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  // Note: this function expects inputs to be sorted on:
  //  parent DESC (and with parent == undefined last), id ASC
  categoriesQryRespToEntities(
    categoryRows: CategoryQueryResponse[],
  ): CategoryEntity[] {
    if (categoryRows.length === 0) {
      return []
    }

    const m = new Map()
    for (const row of categoryRows) {
      const entity = <CategoryEntity>{
        id: row.id,
        name: row.category,
        description: row.description,
        subCategories: [],
      }
      if (m.has(row.id)) {
        entity.subCategories = m.get(row.id)
        m.delete(row.id)
      }

      const parent = row.parent || 0
      if (m.has(parent)) {
        m.get(parent).push(entity)
      } else {
        m.set(parent, [entity])
      }
    }
    return m.get(0)
  }
}
