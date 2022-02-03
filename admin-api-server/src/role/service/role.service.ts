import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { PG_CONNECTION } from '../../constants';
import { DbPool } from '../../db.module';
import { Role } from '../entities/role.entity';

@Injectable()
export class RoleService {
  constructor(@Inject(PG_CONNECTION) private db: DbPool) {}
  async create({ id, roleLabel }: Role) {
    try {
      await this.db.query(
        'INSERT INTO user_role (id, role_label) VALUES ($1, $2)',
        [id, roleLabel],
      );
      return { id, roleLabel };
    } catch (e) {
      throw new HttpException(
        'Unable to create new role',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getLabels(roleIds: number[]): Promise<string[]> {
    const labelsQryRes = await this.db.query(
      `
SELECT role_label
FROM user_role
WHERE id = ANY($1)
`,
      [roleIds],
    );
    return labelsQryRes.rows.map((row: any) => row.role_label);
  }

  async getRoles(): Promise<Role[]> {
    const labelsQryRes = await this.db.query(
      `
SELECT id, role_label
FROM user_role
`
    );
    return labelsQryRes.rows;
  }
}
