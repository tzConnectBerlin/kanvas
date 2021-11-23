import { Test, TestingModule } from '@nestjs/testing'
import { CategoryController } from './category.controller'
import { CategoryService } from '../service/category.service'
import { DbMockModule } from '../../db_mock.module'

describe('CategoryController', () => {
  let controller: CategoryController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DbMockModule],
      controllers: [CategoryController],
      providers: [CategoryService],
    }).compile()

    controller = module.get<CategoryController>(CategoryController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
