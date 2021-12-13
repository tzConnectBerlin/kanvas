import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { QueryParams } from 'src/types';
import { PG_CONNECTION } from '../constants';
import { DbPool } from '../db.module';
import {
  convertToSnakeCase,
  hashPassword,
  prepareFilterClause,
} from '../utils';
import { UserDto } from './dto/user.dto';
import { User } from './entities/user.entity';

const getSelectStatement = (
  whereClause = '',
  limitClause = '',
  sortField = 'id',
  sortDirection = 'ASC',
): string => `SELECT id, user_name as "userName", address, email, password, disabled, ARRAY_AGG(mkuur.user_role_id) as roles 
       FROM kanvas_user ku 
       inner join mtm_kanvas_user_user_role mkuur on mkuur.kanvas_user_id = ku.id ${whereClause}
       GROUP BY ku.id
       ORDER BY ${sortField} ${sortDirection} ${limitClause}`;

const getSelectCountStatement = (
  whereClause = '',
): string => `SELECT COUNT(*) FROM kanvas_user ku 
       inner join mtm_kanvas_user_user_role mkuur on mkuur.kanvas_user_id = ku.id ${whereClause}
       GROUP BY ku.id
       ORDER BY $1`;

const getUpdateQuery = (fields: string[], indexes: string[]) =>
  `UPDATE kanvas_user SET (${fields.join(',')}) = (${indexes.join(
    ',',
  )}) WHERE id = $${fields.length + 1}`;

const INSERT_ROLES_QUERY =
  'INSERT INTO mtm_kanvas_user_user_role (kanvas_user_id, user_role_id) values ($1, unnest($2::integer[]));';

const INSERT_USER_QUERY =
  'INSERT INTO kanvas_user (email, user_name, address, password) VALUES ($1, $2, $3, $4) RETURNING id;';

const DELETE_ROLES_QUERY =
  'DELETE from mtm_kanvas_user_user_role where kanvas_user_id = $1;';

const DELETE_USER_QUERY =
  'UPDATE kanvas_user SET disabled = true WHERE id = $1';

@Injectable()
export class UserService {
  constructor(@Inject(PG_CONNECTION) private db: DbPool) {}
  async create({ password, roles, ...rest }: UserDto) {
    const client = await this.db.connect();
    const hashedPassword = await hashPassword(password);
    try {
      await client.query('BEGIN');
      const resultInsertUser = await client.query(INSERT_USER_QUERY, [
        rest.email,
        rest.userName,
        rest.address,
        hashedPassword,
      ]);
      const userId = resultInsertUser.rows[0].id;
      await client.query(INSERT_ROLES_QUERY, [userId, roles]);
      await client.query('COMMIT');
      return { id: userId, roles, ...rest };
    } catch (e) {
      await client.query('ROLLBACK');
      throw new HttpException(
        'Unable to create new user',
        HttpStatus.BAD_REQUEST,
      );
    } finally {
      client.release();
    }
  }

  async findAll({ range, sort, filter }: QueryParams) {
    const { query: whereClause, params } = prepareFilterClause(filter);
    const limitClause = range
      ? `LIMIT ${range[1] - range[0]} OFFSET ${range[0]}`
      : undefined;
    const sortField = sort && sort[0] ? sort[0] : 'id';
    const sortDirection = sort && sort[1] ? sort[1] : 'ASC';
    const countResult = await this.db.query(
      getSelectCountStatement(whereClause),
      [sortField, ...params],
    );
    const result = await this.db.query<User[]>(
      getSelectStatement(whereClause, limitClause, sortField, sortDirection),
      params,
    );
    return { data: result.rows, count: countResult?.rows[0]?.count ?? 0 };
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

  async update(id: number, { roles, ...rest }: UserDto) {
    const [fields, values] = Object.entries(rest).reduce(
      (acc, [field, value]) => {
        if (value) {
          acc[0].push(convertToSnakeCase(field));
          acc[1].push(value);
        }
        return acc;
      },
      [[] as string[], [] as any[]],
    );
    const indexes = values.map((_, index) => `$${index + 1}`);
    const updateQuery = getUpdateQuery(fields, indexes);
    const client = await this.db.connect();
    try {
      client.query('BEGIN');
      if (roles && roles.length) {
        await client.query(DELETE_ROLES_QUERY, [rest.id]);
        await client.query(INSERT_ROLES_QUERY, [rest.id, roles]);
      }
      const result = await client.query(updateQuery, [...values, id]);
      client.query('COMMIT');
      if (result.rowCount === 1) {
        const { password, ...rest } = await this.findOne(id);
        return rest;
      }
    } catch (e) {
      await client.query('ROLLBACK');
      console.log(e);
      throw new HttpException('Unable to update user', HttpStatus.BAD_REQUEST);
    } finally {
      client.release();
    }
  }

  async remove(id: number) {
    const result = await this.db.query<User>(DELETE_USER_QUERY, [id]);
    if (result.rowCount === 1) {
      const { password, ...rest } = await this.findOne(id);
      return rest;
    }
    throw Error('Unable to disable/delete user');
  }
}
