import { Injectable, Inject } from '@nestjs/common';
import { PG_CONNECTION } from '../../constants.js';
import { DbPool } from '../../db.module.js';
import { Roles } from '../entities/role.entity.js';

@Injectable()
export class RoleService {
  constructor(@Inject(PG_CONNECTION) private db: DbPool) {}
  async createRoles() {
    for (const roleIdStr of Object.keys(Roles)) {
      const roleId: number = Number(roleIdStr);
      if (isNaN(roleId)) {
        continue;
      }
      await this.db.query(
        `
INSERT INTO user_role (
  id, role_label
)
VALUES ($1, $2)
ON CONFLICT DO NOTHING
        `,
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

  async getRoles(): Promise<Roles[]> {
    const labelsQryRes = await this.db.query(
      `
SELECT id, role_label
FROM user_role
`,
    );
    return labelsQryRes.rows;
  }
}
