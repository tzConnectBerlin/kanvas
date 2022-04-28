import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from '../service/user.service';
import { NftService } from 'src/nft/service/nft.service';
import { MintService } from 'src/nft/service/mint.service';
import { IpfsService } from 'src/nft/service/ipfs.service';
import { S3Service } from 'src/s3.service';
import { DbMock } from 'src/mock/db.module';
import { CacheMock } from 'src/mock/cache.module';
import { expectErrWithHttpStatus } from 'src/utils';
import { CategoryService } from 'src/category/service/category.service';
import { mockedRatesProvider, CurrencyService } from 'kanvas_lib';

describe('UserController', () => {
  let controller: UserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DbMock, CacheMock],
      controllers: [UserController],
      providers: [
        UserService,
        CategoryService,
        NftService,
        MintService,
        IpfsService,
        S3Service,
        mockedRatesProvider,
        CurrencyService,
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
