import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { PG_CONNECTION } from '../constants';
import { DbClient } from '../db.module';
import { Role } from './role.entity';

@Injectable()
export class RoleService {
  constructor(@Inject(PG_CONNECTION) private db: DbClient) {}
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
}
