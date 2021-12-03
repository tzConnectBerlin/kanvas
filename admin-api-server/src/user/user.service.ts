import { Inject, Injectable } from '@nestjs/common';
import { PG_CONNECTION } from 'src/constants';
import { DbClient } from 'src/db.module';
import { hashPassword } from 'src/utils';
import { UserDto } from './dto/user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(@Inject(PG_CONNECTION) private db: DbClient) {}
  async create({ password, ...rest }: UserDto) {
    const hashedPassword = await hashPassword(password);
    const result = await this.db.query(
      'INSERT INTO kanvas_user (email, user_name, address, password) VALUES ($1, $2, $3, $4) RETURNING id',
      [rest.email, rest.userName, rest.address, hashedPassword],
    );
    if (result.rowCount > 0) {
      return { id: result.rows[0].id, ...rest };
    }
    throw Error('Unable to create new user');
  }

  async findAll() {
    const result = await this.db.query<User[]>(
      'SELECT id, user_name, address, email, disabled FROM kanvas_user',
    );
    return result.rows;
  }

  async findOne(id: number) {
    const result = await this.db.query<User>(
      'SELECT id, email, user_name, address, password, disabled FROM kanvas_user WHERE id = $1 ',
      [id],
    );
    return result.rows[0];
  }

  async findOneByEmail(email: string) {
    const result = await this.db.query<User>(
      'SELECT id, email, user_name, address, password, disabled FROM kanvas_user WHERE email = $1 ',
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
