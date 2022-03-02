import { CategoryEntity } from 'src/category/entity/category.entity';
import { FilterParams, PaginationParams } from '../params';
import {
  NftEntity,
  NftEntityPage,
  SearchResult,
} from 'src/nft/entity/nft.entity';
import { HttpException, HttpStatus } from '@nestjs/common';

export class NftServiceMock {
  async cachedSearch(str: string): Promise<SearchResult> {
    return await this.search(str);
  }

  async search(str: string): Promise<SearchResult> {
    throw new HttpException(
      `mock search not implemented`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  async cachedFindNftsWithFilter(params: FilterParams): Promise<NftEntityPage> {
    return await this.findNftsWithFilter(params);
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

  async getNftOwnerStatus(address: string, nftIds: number[]) {
    throw new HttpException(
      `mock getNftOwnerStatus not implemented`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
