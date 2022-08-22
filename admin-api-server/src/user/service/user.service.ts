import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';

import { PG_CONNECTION } from '../../constants.js';
import { DbPool } from '../../db.module.js';
import { hashPassword } from '../../utils.js';
import { UserEntity } from '../entities/user.entity.js';
import { UserFilterParams } from '../params.js';
import { Roles } from '../../role/entities/role.entity.js';

@Injectable()
export class UserService {
  constructor(@Inject(PG_CONNECTION) private db: DbPool) {}

  async create({
    password,
    roles,
    id, // taking id here because we don't want it inside rest, it should be undefined
    ...rest
  }: UserEntity): Promise<UserEntity> {
    if (typeof password === 'undefined') {
      throw new HttpException(`no password defined`, HttpStatus.BAD_REQUEST);
    }
    if (!this.#allRolesValid(roles)) {
      throw new HttpException(
        `(partially) invalid roles`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const client = await this.db.connect();
    const hashedPassword = await hashPassword(password);
    try {
      await client.query('BEGIN');

      const resultInsertUser = await client.query(
        `
INSERT INTO
  kanvas_user (email, user_name, password)
  VALUES ($1, $2, $3) RETURNING id
`,
        [rest.email, rest.userName, hashedPassword],
      );

      const userId = resultInsertUser.rows[0].id;

      await client.query(
        `
INSERT INTO
  mtm_kanvas_user_user_role (kanvas_user_id, user_role_id)
  VALUES ($1, unnest($2::integer[]))
`,
        [userId, roles],
      );
      await client.query('COMMIT');

      return { id: userId, roles, ...rest };
    } catch (err: any) {
      Logger.error(
        `failed to create new user (${JSON.stringify({
          roles,
          ...rest,
        })}), err: ${err}`,
      );
      await client.query('ROLLBACK');
      throw new HttpException(
        'Unable to create new user',
        HttpStatus.BAD_REQUEST,
      );
    } finally {
      client.release();
    }
  }

  async findAll(
    params: UserFilterParams,
  ): Promise<{ data: UserEntity[]; count: number }> {
    const qryRes = await this.db.query(
      `
  WITH user_roles AS (
    SELECT
      mtm_user_role.kanvas_user_id,
      ARRAY_AGG(user_role.id) AS role_ids
    FROM user_role
    JOIN mtm_kanvas_user_user_role AS mtm_user_role
      ON mtm_user_role.user_role_id = user_role.id
    GROUP BY 1
  )
  SELECT
    kanvas_user.id,
    email,
    user_name AS "userName",
    COALESCE(user_roles.role_ids, '{}'::INTEGER[]) AS roles,
    COUNT(1) OVER () AS total_matched_users
  FROM kanvas_user
  LEFT JOIN user_roles
    ON user_roles.kanvas_user_id = kanvas_user.id
  WHERE ($1::INTEGER[] IS NULL OR kanvas_user.id = ANY($1::INTEGER[]))
    AND ($2::TEXT[] IS NULL OR user_name = ANY($2::TEXT[]))
    AND ($3::INTEGER[] IS NULL OR user_roles.role_ids && $3::INTEGER[])
    AND NOT kanvas_user.disabled
  ORDER BY "${params.orderBy}" ${params.orderDirection} ${
        params.orderBy !== 'id' ? ', id' : ''
      }
  OFFSET ${params.pageOffset}
  LIMIT ${params.pageSize}
`,
      [
        params.filters.id,
        params.filters.userName,
        params.filters.roleIds,
      ],
    );

    if (qryRes.rowCount === 0) {
      return { data: [], count: 0 };
    }

    return {
      data: qryRes.rows.map(
        (row: any) =>
          <UserEntity>{
            id: row['id'],
            email: row['email'],
            userName: row['userName'],
            roles: row['roles'],
          },
      ),
      count: Number(qryRes.rows[0]['total_matched_users']),
    };
  }

  async findOne(id: number): Promise<UserEntity> {
    const params = new UserFilterParams();
    params.filters.id = [id];
    const findRes = await this.findAll(params);
    if (findRes.data.length === 0) {
      throw new HttpException(
        `no user exists with this id`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return findRes.data[0];
  }

  // Function used for auth this is why password is fetch
  async findOneByEmail(email: string): Promise<UserEntity | undefined> {
    const result = await this.db.query<UserEntity>(
      `
SELECT
  id,
  user_name as "userName",
  email,
  password,
  disabled,
  COALESCE(ARRAY_AGG(mkuur.user_role_id), '{}'::INTEGER[]) AS roles
FROM kanvas_user ku
LEFT JOIN mtm_kanvas_user_user_role mkuur ON mkuur.kanvas_user_id = ku.id
WHERE email = $1
  AND NOT ku.disabled
GROUP BY ku.id
`,
      [email],
    );
    if (result.rowCount === 0) {
      return undefined;
    }
    return result.rows[0];
  }

  async update(id: number, { roles, ...rest }: UserEntity) {
    if (!this.#allRolesValid(roles)) {
      throw new HttpException(
        `(partially) invalid roles`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const concernedUser = await this.findOne(id);
    const client = await this.db.connect();

    // Doing complex stuff for nothing
    const deleteRoles = concernedUser.roles.filter(
      (role: number) => roles.indexOf(role) === -1,
    );
    const addRoles = roles.filter(
      (role: number) => concernedUser.roles.indexOf(role) === -1,
    );

    try {
      await client.query('BEGIN');

      await client.query(
        `
DELETE FROM mtm_kanvas_user_user_role
WHERE kanvas_user_id = $1
  AND user_role_id = ANY($2)
    `,
        [id, deleteRoles],
      );
      await client.query(
        `
INSERT INTO mtm_kanvas_user_user_role (
  kanvas_user_id, user_role_id
)
SELECT $1, UNNEST($2::INTEGER[])
        `,
        [id, addRoles],
      );

      await client.query('COMMIT');
    } catch (error: any) {
      Logger.error(`Unable to update the user, error: ${error}`);
      await client.query('ROLLBACK');
      throw new Error(`Unable to update the user.`);
    } finally {
      client.release();
    }
    return await this.findOne(id);
  }

  async remove(id: number) {
    const result = await this.db.query<UserEntity>(
      `
UPDATE kanvas_user
SET disabled = true
WHERE id = $1
`,
      [id],
    );
    if (result.rowCount === 0) {
      throw new HttpException(
        `user with this id does not exist`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  #allRolesValid(roles: Roles[]): boolean {
    return !roles.some((roleId) => !Object.values(Roles).includes(roleId));
  }
}
