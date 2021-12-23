import { CategoryEntity } from 'src/category/entity/category.entity';
import { FilterParams, PaginationParams } from '../params';
import {
  NftEntity,
  NftEntityPage,
  SearchResult,
} from 'src/nft/entity/nft.entity';
import { HttpException, HttpStatus } from '@nestjs/common';

export class NftServiceMock {
  async search(str: string): Promise<SearchResult> {
    throw new HttpException(
      `mock search not implemented`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  async findNftsWithFilter(params: FilterParams): Promise<NftEntityPage> {
    throw new HttpException(
      `mock findNftsWithFilter not implemented`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  async byId(id: number): Promise<NftEntity> {
    throw new HttpException(
      `mock byId not implemented`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  async findByIds(
    nftIds: number[],
    orderBy: string = 'nft_id',
    orderDirection: string = 'asc',
  ): Promise<NftEntity[]> {
    throw new HttpException(
      `mock findByIds not implemented`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
