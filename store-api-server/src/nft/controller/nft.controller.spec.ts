/* eslint-disable  @typescript-eslint/no-non-null-assertion */
import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, CACHE_MANAGER } from '@nestjs/common';
import { NftController } from './nft.controller';
import { DbMock } from 'src/mock/db.module';
import { CacheMock } from 'src/mock/cache.module';
import { NftService } from '../service/nft.service';
import { IpfsService } from 'src/nft/service/ipfs.service';
import { NftServiceMock } from '../service/nft_mock.service';
import { CategoryService } from 'src/category/service/category.service';
import { PaginationParams } from '../params';
import { mockedRatesProvider, CurrencyService } from 'kanvas-api-lib';

describe('NftController', () => {
  let controller: NftController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DbMock, CacheMock, NftServiceMock],
      controllers: [NftController],
      providers: [
        {
          provide: NftService,
          useClass: NftServiceMock,
        },
        {
          provide: CACHE_MANAGER,
          useClass: CacheMock,
        },
        CategoryService,
        mockedRatesProvider,
        CurrencyService,
        IpfsService,
      ],
    }).compile();

    controller = module.get<NftController>(NftController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  const getFilteredHttpStatusTests = [
    {
      name: 'bad page number (< 1)',
      params: { ...new PaginationParams(), page: 0 },
      expStatusCode: 400,
    },
    {
      name: 'bad page number (< 1), part 2',
      params: { ...new PaginationParams(), page: -1 },
      expStatusCode: 400,
    },
    {
      name: 'bad page size (< 1)',
      params: { ...new PaginationParams(), pageSize: 0 },
      expStatusCode: 400,
    },
    {
      name: 'empty order direction',
      params: { ...new PaginationParams(), orderDirection: '' },
      expStatusCode: 400,
    },
    {
      name: 'nonsense order direction',
      params: {
        ...new PaginationParams(),
        orderDirection: 'nonsense direction',
      },
      expStatusCode: 400,
    },
    {
      name: 'empty order by',
      params: { ...new PaginationParams(), orderBy: '' },
      expStatusCode: 400,
    },
    {
      name: 'nonsense order by',
      params: { ...new PaginationParams(), orderBy: 'nonsense order by' },
      expStatusCode: 400,
    },
    {
      name: 'nonsense availability entry',
      params: {
        ...new PaginationParams(),
        availability: ['soldOut', 'nonsense'],
      },
      expStatusCode: 400,
    },
    {
      name: 'all default values is OK (note: expecting 500, due to mock throwing an err after params checks)',
      params: new PaginationParams(),
      expStatusCode: 500,
    },
  ];

  const mockResponse: any = () => {
    const res: any = {};
    // replace the following () => res
    // with your function stub/mock of choice
    // making sure they still return `res`
    res.status = () => res;
    res.json = () => res;
    return res;
  };

  for (const { name, params, expStatusCode } of getFilteredHttpStatusTests) {
    it(`${name}: should return ${expStatusCode} for .get(${JSON.stringify(
      params,
    )})`, async () => {
      await expectErrWithHttpStatus(expStatusCode, () =>
        controller.getFiltered(mockResponse, params),
      );
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
    //console.log(err);
    expect(err instanceof HttpException).toBe(true);

    const gotStatusCode = err.getStatus();
    expect(gotStatusCode).toEqual(expStatusCode);
    return;
  }
  expect('expected HttpException').toBe('got no error');
}
