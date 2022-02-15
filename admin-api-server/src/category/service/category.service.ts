import {
  Logger,
  HttpStatus,
  HttpException,
  Injectable,
  Inject,
} from '@nestjs/common';
import { CategoryEntity } from '../entity/category.entity';
import { PG_CONNECTION_STORE_REPLICATION } from '../../constants';

@Injectable()
export class CategoryService {
  constructor(@Inject(PG_CONNECTION_STORE_REPLICATION) private conn: any) {}

  async getNftAssignable(): Promise<CategoryEntity[]> {
    try {
      const qryRes = await this.conn.query(
        `
SELECT leaf.id, leaf.category
FROM nft_category leaf
WHERE NOT EXISTS (
  SELECT 1 FROM nft_category child WHERE child.parent = leaf.id
)
ORDER BY leaf.id`,
        [],
      );
      return qryRes.rows.map(
        (row: any) =>
          <CategoryEntity>{
            id: row['id'],
            name: row['category'],
          },
      );
    } catch (err) {
      Logger.error('Error on get categories query, err: ' + err);
      throw new HttpException(
        'Something went wrong',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
