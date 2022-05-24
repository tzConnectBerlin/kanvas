import { Test, TestingModule } from '@nestjs/testing';
import { CategoryController } from './category.controller';
import { CategoryService } from '../service/category.service';
import { DbMock } from '../../mock/db.module';
import { CacheMock } from '../../mock/cache.module';

describe('CategoryController', () => {
  let controller: CategoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DbMock, CacheMock],
      controllers: [CategoryController],
      providers: [CategoryService],
    }).compile();

    controller = module.get<CategoryController>(CategoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
