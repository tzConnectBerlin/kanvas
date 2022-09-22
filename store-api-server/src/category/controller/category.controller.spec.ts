import { Test, TestingModule } from '@nestjs/testing';
import { CategoryController } from './category.controller';
import { CategoryService } from '../service/category.service';
import { DbMock } from '../../mock/db.module';
import { CacheMock } from '../../mock/cache.module';
import { NftModule } from '../../nft/nft.module';
import { mockedRatesProvider, CurrencyService } from 'kanvas-api-lib';
import { NftIpfsService } from '../../nft/service/ipfs.service';
import { IpfsPinMock } from '../../mock/ipfs_pin.module';
import { NftService } from '../../nft/service/nft.service';

describe('CategoryController', () => {
  let controller: CategoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DbMock, CacheMock, IpfsPinMock],
      controllers: [CategoryController],
      providers: [
        CategoryService,
        NftService,
        mockedRatesProvider,
        CurrencyService,
        NftIpfsService,
      ],
    }).compile();

    controller = module.get<CategoryController>(CategoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
