import { Test, TestingModule } from '@nestjs/testing';
import { CategoryController } from './category.controller';
import { CategoryService } from '../service/category.service';
import { DbMock } from '../../mock/db.module';
import { CacheMock } from '../../mock/cache.module';
import { NftModule } from '../../nft/nft.module';
import { mockedRatesProvider, CurrencyService } from 'kanvas-api-lib';
import { IpfsService } from '../../nft/service/ipfs.service';
import { NftService } from '../../nft/service/nft.service';

describe('CategoryController', () => {
  let controller: CategoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DbMock, CacheMock],
      controllers: [CategoryController],
      providers: [
        CategoryService,
        NftService,
        mockedRatesProvider,
        CurrencyService,
        IpfsService,
      ],
    }).compile();

    controller = module.get<CategoryController>(CategoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
