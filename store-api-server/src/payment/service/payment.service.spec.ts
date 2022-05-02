import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { UserService } from '../../user/service/user.service';
import { S3Service } from '../../s3.service';
import { NftService } from '../../nft/service/nft.service';
import { IpfsService } from '../../nft/service/ipfs.service';
import { MintService } from '../../nft/service/mint.service';
import { CategoryService } from '../../category/service/category.service';
import { DbMock } from '../../mock/db.module';
import { CacheMock } from '../../mock/cache.module';
import { mockedRatesProvider, CurrencyService } from 'kanvas-api-lib';

describe('PaymentService', () => {
  let service: PaymentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DbMock, CacheMock],
      providers: [
        UserService,
        S3Service,
        NftService,
        MintService,
        CategoryService,
        PaymentService,
        IpfsService,
        mockedRatesProvider,
        CurrencyService,
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
