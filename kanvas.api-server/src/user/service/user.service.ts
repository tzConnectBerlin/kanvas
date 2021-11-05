import { UserEntity } from '../entity/user.entity'

export class UserService {
  async create(_user: UserEntity): Promise<UserEntity> {
    throw new Error('Not yet implemented') // TODO make a query here and parse the result
  }

  async findAll(): Promise<UserEntity[]> {
    throw new Error('Not yet implemented') // TODO make a query here and parse the result
  }

  async findByAddress(_userAddress: string): Promise<UserEntity> {
    throw new Error('Not yet implemented') // TODO make a query here and parse the result
  }
}
