import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { UserService } from 'src/user/service/user.service';
import { S3Service } from 'src/s3.service';
import { NftService } from 'src/nft/service/nft.service';
import { IpfsService } from 'src/nft/service/ipfs.service';
import { MintService } from 'src/nft/service/mint.service';
import { CategoryService } from 'src/category/service/category.service';
import { DbMock } from 'src/mock/db.module';
import { CacheMock } from 'src/mock/cache.module';
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
