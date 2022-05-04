import { Test, TestingModule } from '@nestjs/testing';
import { DbMock } from 'src/mock/db.module';
import { CacheMock } from 'src/mock/cache.module';
import { PaymentController } from './payment.controller';
import { PaymentService } from '../service/payment.service';
import { UserService } from 'src/user/service/user.service';
import { S3Service } from 'src/s3.service';
import { NftService } from 'src/nft/service/nft.service';
import { IpfsService } from 'src/nft/service/ipfs.service';
import { MintService } from 'src/nft/service/mint.service';
import { CategoryService } from 'src/category/service/category.service';
import { mockedRatesProvider, CurrencyService } from 'kanvas-api-lib';

describe('PaymentController', () => {
  let controller: PaymentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DbMock, CacheMock],
      controllers: [PaymentController],
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

    controller = module.get<PaymentController>(PaymentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
