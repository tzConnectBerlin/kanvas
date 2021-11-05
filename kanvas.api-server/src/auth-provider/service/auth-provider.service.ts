import { Injectable } from '@nestjs/common'
import { AuthProviderEntity } from '../entity/auth-provider.entity'

@Injectable()
export class AuthProviderService {
  async create(_user: AuthProviderEntity): Promise<AuthProviderEntity> {
    throw new Error('Not implemented yet')
  }
  async findAll(): Promise<AuthProviderEntity[]> {
    throw new Error('Not implemented yet')
  }
}
