import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { PaymentStatus } from '../entity/payment.entity';
import { UserService } from '../../user/service/user.service';
import { S3Service } from '../../s3.service';
import { NftService } from '../../nft/service/nft.service';
import { NftIpfsService } from '../../nft/service/ipfs.service';
import { IpfsPinMock } from '../../mock/ipfs_pin.module';
import { MintService } from '../../nft/service/mint.service';
import { CategoryService } from '../../category/service/category.service';
import { DbMock } from '../../mock/db.module';
import { CacheMock } from '../../mock/cache.module';
import { mockedRatesProvider, CurrencyService } from 'kanvas-api-lib';

describe('PaymentService', () => {
  let service: PaymentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DbMock, CacheMock, IpfsPinMock],
      providers: [
        UserService,
        S3Service,
        NftService,
        MintService,
        CategoryService,
        PaymentService,
        NftIpfsService,
        mockedRatesProvider,
        CurrencyService,
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  for (const tc of [
    { statuses: [], exp: undefined },
    { statuses: [PaymentStatus.SUCCEEDED], exp: PaymentStatus.SUCCEEDED },
    {
      statuses: [PaymentStatus.FAILED, PaymentStatus.SUCCEEDED],
      exp: PaymentStatus.SUCCEEDED,
    },
    {
      statuses: [PaymentStatus.CANCELED, PaymentStatus.SUCCEEDED],
      exp: PaymentStatus.SUCCEEDED,
    },
    {
      statuses: [PaymentStatus.TIMED_OUT, PaymentStatus.SUCCEEDED],
      exp: PaymentStatus.SUCCEEDED,
    },
    {
      statuses: [PaymentStatus.TIMED_OUT, PaymentStatus.PROMISED],
      exp: PaymentStatus.PROMISED,
    },
    {
      statuses: [PaymentStatus.PROMISED, PaymentStatus.CANCELED],
      exp: PaymentStatus.PROMISED,
    },
    {
      statuses: [PaymentStatus.PROMISED, PaymentStatus.CREATED],
      exp: PaymentStatus.PROMISED,
    },
    {
      statuses: [PaymentStatus.PROCESSING, PaymentStatus.PROMISED],
      exp: PaymentStatus.PROCESSING,
    },
    {
      statuses: [PaymentStatus.PROCESSING, PaymentStatus.CANCELED],
      exp: PaymentStatus.PROCESSING,
    },
    {
      statuses: [PaymentStatus.CREATED, PaymentStatus.PROCESSING],
      exp: PaymentStatus.PROCESSING,
    },
  ]) {
    it(`should collapse ${tc.statuses} into ${tc.exp}`, () => {
      expect(service.furthestPaymentStatus(tc.statuses)).toEqual(tc.exp);
    });
  }
});
