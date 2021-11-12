require('dotenv').config()
import { Test, TestingModule } from '@nestjs/testing'
import { NftController } from './nft.controller'
import { DbMockModule } from '../../db_mock.module'
import { NftService } from '../service/nft.service'

describe('NftController', () => {
  let controller: NftController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DbMockModule],
      controllers: [NftController],
      providers: [NftService],
    }).compile()

    controller = module.get<NftController>(NftController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
