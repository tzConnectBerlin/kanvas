import { Inject, Injectable } from '@nestjs/common';
import { PG_CONNECTION } from 'src/constants';
import { DbClient } from 'src/db.module';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(@Inject(PG_CONNECTION) private db: DbClient) {}
  async create(createUserDto: CreateUserDto) {
    const result = await this.db.query(
      'INSERT INTO kanvas_user (user_name, address, signed_payload) VALUES ($1, $2, $3) RETURNING id',
      [
        createUserDto.user_name,
        createUserDto.address,
        createUserDto.signed_payload,
      ],
    );
    if (result.rowCount > 0) {
      return { id: result.rows[0].id, ...createUserDto };
    }
    throw Error('Unable to create new user');
  }

  async findAll() {
    const result = await this.db.query<User[]>(
      'SELECT id, user_name, address, signed_payload FROM kanvas_user',
    );
    return result.rows;
  }

  async findOne(id: number) {
    const result = await this.db.query<User>(
      'SELECT id, user_name, address, signed_payload FROM kanvas_user WHERE id = $1 ',
      [id],
    );
    return result.rows;
  }

  update(id: number, _updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
