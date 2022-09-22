import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from '../service/user.service';
import { NftService } from '../../nft/service/nft.service';
import { MintService } from '../../nft/service/mint.service';
import { NftIpfsService } from '../../nft/service/ipfs.service';
import { S3Service } from '../../s3.service';
import { DbMock } from '../../mock/db.module';
import { IpfsPinMock } from '../../mock/ipfs_pin.module';
import { CacheMock } from '../../mock/cache.module';
import { CategoryService } from '../../category/service/category.service';
import { mockedRatesProvider, CurrencyService } from 'kanvas-api-lib';

async function expectErrWithHttpStatus(
  expStatusCode: number,
  f: () => Promise<any>,
): Promise<void> {
  try {
    await f();
  } catch (err: any) {
    //Logger.error(err);
    expect(err instanceof HttpException).toBe(true);

    const gotStatusCode = err.getStatus();
    expect(gotStatusCode).toEqual(expStatusCode);
    return;
  }
  expect('expected HttpException').toBe('got no error');
}

describe('UserController', () => {
  let controller: UserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DbMock, CacheMock, IpfsPinMock],
      controllers: [UserController],
      providers: [
        UserService,
        CategoryService,
        NftService,
        MintService,
        NftIpfsService,
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
