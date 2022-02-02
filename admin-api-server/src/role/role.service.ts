import { Injectable, Inject } from '@nestjs/common';
import { PG_CONNECTION } from '../constants';
import { DbPool } from '../db.module';
import { Roles } from './role.entity';

@Injectable()
export class RoleService {
  constructor(@Inject(PG_CONNECTION) private db: DbPool) {}
  async createRoles() {
    for (const roleId of Object.keys(Roles)) {
      if (isNaN(Number(roleId))) {
        continue;
      }
      await this.db.query(
        'INSERT INTO user_role (id, role_label) VALUES ($1, $2)',
        [roleId, Roles[roleId]],
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
}
