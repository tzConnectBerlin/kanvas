import { Test, TestingModule } from '@nestjs/testing';
import { NftService } from './nft.service';
import { CategoryService } from '../../category/service/category.service';
import { IpfsService } from '../../nft/service/ipfs.service';
import { DbMock } from '../../mock/db.module';
import { CacheMock } from '../../mock/cache.module';
import { mockedRatesProvider, CurrencyService } from 'kanvas-api-lib';

describe('NftService', () => {
  let service: NftService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DbMock, CacheMock],
      providers: [
        NftService,
        CategoryService,
        mockedRatesProvider,
        CurrencyService,
        IpfsService,
      ],
    }).compile();

    service = module.get<NftService>(NftService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
