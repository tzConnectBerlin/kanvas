import { Test, TestingModule } from '@nestjs/testing';
import { DbMock } from '../../mock/db.module.js';
import { CacheMock } from '../../mock/cache.module.js';
import { PaymentController } from './payment.controller.js';
import { PaymentService } from '../service/payment.service.js';
import { UserService } from '../../user/service/user.service.js';
import { S3Service } from '../../s3.service.js';
import { NftService } from '../../nft/service/nft.service.js';
import { IpfsService } from '../../nft/service/ipfs.service.js';
import { MintService } from '../../nft/service/mint.service.js';
import { CategoryService } from '../../category/service/category.service.js';
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
