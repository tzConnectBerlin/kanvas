import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { NftService } from '../../nft/service/nft.service';
import { MintService } from '../../nft/service/mint.service';
import { CategoryService } from '../../category/service/category.service';
import { NftIpfsService } from '../../nft/service/ipfs.service';
import { IpfsPinMock } from '../../mock/ipfs_pin.module';
import { S3Service } from '../../s3.service';
import { DbMock } from '../../mock/db.module';
import { CacheMock } from '../../mock/cache.module';
import { mockedRatesProvider, CurrencyService } from 'kanvas-api-lib';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DbMock, CacheMock, IpfsPinMock],
      providers: [
        NftService,
        CategoryService,
        UserService,
        MintService,
        NftIpfsService,
        S3Service,
        mockedRatesProvider,
        CurrencyService,
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
