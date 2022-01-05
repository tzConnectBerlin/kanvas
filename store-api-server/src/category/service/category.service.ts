import {
  Logger,
  HttpStatus,
  HttpException,
  Injectable,
  Inject,
} from '@nestjs/common';
import { CategoryEntity } from '../entity/category.entity';
import {
  PG_CONNECTION,
  SEARCH_SIMILARITY_LIMIT,
  SEARCH_MAX_CATEGORIES,
} from '../../constants';

interface CategoryQueryResponse {
  id: number;
  category: string;
  description: string;
  parent: number | undefined;
}

@Injectable()
export class CategoryService {
  constructor(@Inject(PG_CONNECTION) private conn: any) {}

  async create(_category: CategoryEntity): Promise<CategoryEntity> {
    throw new Error('Not implemented yet');
  }

  async search(str: string): Promise<CategoryEntity[]> {
    if (str === '') {
      return await this.getMostPopular();
    }

    const qryRes = await this.conn.query(
      `
SELECT id, category AS name, description
FROM (
  SELECT
    id,
    category,
    description,
    GREATEST(
      word_similarity($1, category),
      word_similarity($1, description)
    ) AS similarity
  FROM nft_category
) AS inner_query
WHERE similarity >= $2
ORDER BY similarity DESC, id
LIMIT $3
    `,
      [str, SEARCH_SIMILARITY_LIMIT, SEARCH_MAX_CATEGORIES],
    );

    return qryRes.rows;
  }

  async getMostPopular(): Promise<CategoryEntity[]> {
    const qryRes = await this.conn.query(
      `
SELECT cat.id, cat.category AS name, cat.description
FROM (
  SELECT cat.id as cat_id, SUM(nft.view_count) AS view_count
  FROM nft_category AS cat
  JOIN mtm_nft_category AS mtm
    ON mtm.nft_category_id = cat.id
  JOIN nft
    ON nft.id = mtm.nft_id
  GROUP BY 1
  ORDER BY 2 DESC
  LIMIT $1
) AS view_counts
JOIN nft_category AS cat
  on cat.id = view_counts.cat_id
ORDER BY view_count
`,
      [SEARCH_MAX_CATEGORIES],
    );
    return qryRes.rows;
  }

  async findAll(): Promise<CategoryEntity[]> {
    try {
      const categoriesQryRes = await this.conn.query(
        `
SELECT id, category, description, parent
FROM nft_category
ORDER BY COALESCE(parent, 0) DESC, id`,
        [],
      );
      return this.categoriesQryRespToEntities(categoriesQryRes.rows);
    } catch (err) {
      Logger.error('Error on get categories query, err: ' + err);
      throw new HttpException(
        'Something went wrong',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Note: this function expects inputs to be sorted on:
  //  parent DESC (and with parent == undefined last), id ASC
  categoriesQryRespToEntities(
    categoryRows: CategoryQueryResponse[],
  ): CategoryEntity[] {
    if (categoryRows.length === 0) {
      return [];
    }

    const m = new Map();
    for (const row of categoryRows) {
      const entity = <CategoryEntity>{
        id: row.id,
        name: row.category,
        description: row.description,
        children: [],
      };
      if (m.has(row.id)) {
        entity.children = m.get(row.id);
        m.delete(row.id);
      }

      const parent = row.parent || 0;
      if (m.has(parent)) {
        m.get(parent).push(entity);
      } else {
        m.set(parent, [entity]);
      }
    }
    return m.get(0);
  }
}
