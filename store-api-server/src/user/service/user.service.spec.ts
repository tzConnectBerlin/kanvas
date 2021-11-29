require('dotenv').config()
import { Test, TestingModule } from '@nestjs/testing'
import { UserService } from './user.service'
import { DbMockModule } from '../../db_mock.module'
import { NftService } from '../../nft/service/nft.service'
import { S3Service } from '../../s3.service'

describe('UserService', () => {
  let service: UserService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DbMockModule],
      providers: [NftService, UserService, S3Service],
    }).compile()

    service = module.get<UserService>(UserService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
