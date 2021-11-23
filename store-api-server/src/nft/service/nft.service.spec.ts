require('dotenv').config()
import { Test, TestingModule } from '@nestjs/testing'
import { NftService } from './nft.service'
import { DbMockModule } from '../../db_mock.module'

describe('NftService', () => {
  let service: NftService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DbMockModule],
      providers: [NftService],
    }).compile()

    service = module.get<NftService>(NftService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
