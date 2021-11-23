import { Injectable } from '@nestjs/common'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { Client } from 'pg'

const pgConn = new Client().connect()

@Injectable()
export class UserService {
  create(createUserDto: CreateUserDto) {
    return pgConn.query(
      'INSERT INTO user VALUES (?, ?, ?)',
      createUserDto.user_name,
      createUserDto.address,
      createUserDto.signed_payload,
    )
  }

  findAll() {
    return `This action returns all user`
  }

  findOne(id: number) {
    return pgConn.query(
      'SELECT (id, user_name, address, signed_payload) FROM kanvas_user WHERE id = ? ',
      id,
    )
  }

  update(id: number, _updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`
  }

  remove(id: number) {
    return `This action removes a #${id} user`
  }
}
