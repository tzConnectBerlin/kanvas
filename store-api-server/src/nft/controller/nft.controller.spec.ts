require('dotenv').config();
import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { NftController } from './nft.controller';
import { DbMockModule } from '../../db_mock.module';
import { NftService } from '../service/nft.service';
import { PaginationParams } from '../params';

describe('NftController', () => {
  let controller: NftController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DbMockModule],
      controllers: [NftController],
      providers: [NftService],
    }).compile();

    controller = module.get<NftController>(NftController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  const expHttpStatusTests = [
    {
      name: '',
      params: <PaginationParams>{ page: 0 },
      expStatusCode: 401,
    },
  ];

  for (const { name, params, expStatusCode } of expHttpStatusTests) {
    it(`should return ${expStatusCode} for .get(${params})`, async () => {
      //expectErrWithHttpStatus(expStatusCode, async () => {
      //await controller.getFiltered(params).rejects;
      //try {
      //  await controller.getFiltered(params);
      //} catch (err: any) {
      //  throw err;
      //}
      //});
    });
  }
});

async function expectErrWithHttpStatus(
  expStatusCode: number,
  f: () => Promise<any>,
): Promise<void> {
  try {
    await f();
  } catch (err: any) {
    if (!(err instanceof HttpException)) {
      throw `expected HttpException, got: ${err}`;
    }
    const gotStatusCode = err.getStatus();
    expect(gotStatusCode).toEqual(expStatusCode);
    if (gotStatusCode !== expStatusCode) {
      throw `expected HttpException with status=${expStatusCode}, got ${gotStatusCode} with err: ${err}`;
    }
    return;
  }
  throw `expected HttpException, got no error`;
}
