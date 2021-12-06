import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { PG_CONNECTION } from '../constants';
import { DbClient } from '../db.module';
import { hashPassword } from '../utils';
import { UserDto } from './dto/user.dto';
import { User } from './entities/user.entity';

const getSelectStatement = (whereClause = ''): string => {
  return `SELECT id, user_name as "userName", address, email, disabled, ARRAY_AGG(mkuur.user_role_id) as roles 
       FROM kanvas_user ku 
       inner join mtm_kanvas_user_user_role mkuur on mkuur.kanvas_user_id = ku.id ${whereClause}
       GROUP BY ku.id`;
};

@Injectable()
export class UserService {
  constructor(@Inject(PG_CONNECTION) private db: DbClient) {}
  async create({ password, roles, ...rest }: UserDto) {
    const hashedPassword = await hashPassword(password);
    try {
      await this.db.query('BEGIN');
      const resultInsertUser = await this.db.query(
        'INSERT INTO kanvas_user (email, user_name, address, password) VALUES ($1, $2, $3, $4) RETURNING id',
        [rest.email, rest.userName, rest.address, hashedPassword],
      );
      const userId = resultInsertUser.rows[0].id;
      let rolesIndex = 0;
      const insertRolesQuery = `INSERT INTO mtm_kanvas_user_user_role (kanvas_user_id, user_role_id) values ${roles
        .map(() => {
          const userIdIndex = rolesIndex + 1;
          rolesIndex = userIdIndex + 1;
          return `($${userIdIndex}, $${rolesIndex})`;
        })
        .join(',')}`;
      const insertRoleValues = roles.map((roleId) => [userId, roleId]).flat();
      await this.db.query(insertRolesQuery, insertRoleValues);
      await this.db.query('COMMIT');
      return { id: userId, roles, ...rest };
    } catch (e) {
      await this.db.query('ROLLBACK');
      throw new HttpException(
        'Unable to create new user',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async findAll() {
    const result = await this.db.query<User[]>(getSelectStatement());
    return result.rows;
  }

  async findOne(id: number) {
    const result = await this.db.query<User>(
      getSelectStatement(`WHERE id = $1`),
      [id],
    );
    return result.rows[0];
  }

  async findOneByEmail(email: string) {
    const result = await this.db.query<User>(
      getSelectStatement(`WHERE email = $1`),
      [email],
    );
    return result.rows[0];
  }

  async update(id: number, updateData: UserDto) {
    const [fields, values] = Object.entries(updateData).reduce(
      (acc, [field, value]) => {
        if (value) {
          acc[0].push(field);
          acc[1].push(value);
        }
        return acc;
      },
      [[] as string[], [] as any[]],
    );
    const indexes = values.map((_, index) => `$${index + 1}`);
    const query = `UPDATE kanvas_user SET (${fields.join(
      ',',
    )}) = (${indexes.join(',')}) WHERE id = $${fields.length + 1}`;
    const result = await this.db.query(query, [...values, id]);
    if (result.rowCount === 1) {
      const { password, ...rest } = await this.findOne(id);
      return rest;
    }
    throw Error('Unable to update user');
  }

  async remove(id: number) {
    const result = await this.db.query<User>(
      'UPDATE kanvas_user SET disabled = true WHERE id = $1',
      [id],
    );
    if (result.rowCount === 1) {
      const { password, ...rest } = await this.findOne(id);
      return rest;
    }
    throw Error('Unable to disable/delete user');
  }
}
