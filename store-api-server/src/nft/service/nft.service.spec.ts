import { Test, TestingModule } from '@nestjs/testing';
import { NftService } from './nft.service';
import { CategoryService } from 'src/category/service/category.service';
import { IpfsService } from 'src/nft/service/ipfs.service';
import { DbMock } from 'src/mock/db.module';
import { CacheMock } from 'src/mock/cache.module';
import { CurrencyService } from 'src/currency.service';
import { mockedRatesProvider } from 'src/mock/rates.provider';

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
