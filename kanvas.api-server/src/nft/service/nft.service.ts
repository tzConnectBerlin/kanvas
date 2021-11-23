import {
  HttpException,
  HttpStatus,
  Logger,
  Injectable,
  Inject,
} from '@nestjs/common'
import { NftEntity, NftEntityPage } from 'src/nft/entity/nft.entity'
import { CategoryEntity } from 'src/category/entity/category.entity'
import { FilterParams, PaginationParams } from '../params'
import { PG_CONNECTION } from '../../constants'

@Injectable()
export class NftService {
  constructor(@Inject(PG_CONNECTION) private conn: any) {}

  async create(_nft: NftEntity): Promise<NftEntity> {
    throw new Error(
      "Not yet implemented - let's implement it when we need it rather than have a big generated code blob",
    )
  }
  async edit(_nft: NftEntity): Promise<NftEntity> {
    throw new Error(
      "Not yet implemented - let's implement it when we need it rather than have a big generated code blob",
    )
  }

  async findAll(params: PaginationParams): Promise<NftEntityPage> {
    return this.findNftsWithFilter({
      ...params,
      categories: undefined,
      address: undefined,
    })
  }

  async findNftsWithFilter(params: FilterParams): Promise<NftEntityPage> {
    const orderByMapping = new Map([
      ['id', 'nft_id'],
      ['name', 'nft_name'],
      ['price', 'price'],
    ])

    const orderBy = orderByMapping.get(params.orderBy)
    if (typeof orderBy === 'undefined') {
      Logger.error(
        'Error in nft.filter(), orderBy unmapped, request.orderBy: ' +
          params.orderBy,
      )
      throw new HttpException(
        'Something went wrong',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }

    const offset = (params.page - 1) * params.pageSize
    const limit = params.pageSize

    let untilNft: string | undefined = undefined
    if (typeof params.firstRequestAt === 'number') {
      untilNft = new Date(params.firstRequestAt * 1000).toISOString()
    }

    try {
      const nftIds = await this.conn.query(
        `
SELECT nft_id, total_nft_count
FROM nft_ids_filtered($1, $2, $3, $4, $5, $6, $7)`,
        [
          params.address,
          params.categories,
          orderBy,
          params.order,
          offset,
          limit,
          untilNft,
        ],
      )

      const res = <NftEntityPage>{
        currentPage: params.page,
        numberOfPages: 0,
        firstRequestAt: params.firstRequestAt,
        nfts: [],
      }
      if (nftIds.rows.length === 0) {
        return res
      }

      res.numberOfPages = Math.ceil(
        nftIds.rows[0].total_nft_count / params.pageSize,
      )
      res.nfts = await this.findByIds(
        nftIds.rows.map((row: any) => row.nft_id),
        orderBy,
        params.order,
      )
      return res
    } catch (err) {
      Logger.error('Error on nft filtered query, err: ' + err)
      throw new HttpException(
        'Something went wrong',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  async byId(id: number): Promise<NftEntity> {
    const nfts = await this.findByIds([id], 'nft_id', 'asc')
    if (nfts.length === 0) {
      throw new HttpException(
        'NFT with the requested id does not exist',
        HttpStatus.BAD_REQUEST,
      )
    }
    return nfts[0]
  }

  async findByIds(
    nftIds: number[],
    orderBy: string,
    orderDirection: string,
  ): Promise<NftEntity[]> {
    try {
      const nftsQryRes = await this.conn.query(
        `
SELECT nft_id, nft_name, ipfs_hash, metadata, data_uri, contract, token_id, categories
FROM nfts_by_id($1, $2, $3)`,
        [nftIds, orderBy, orderDirection],
      )
      return nftsQryRes.rows.map((nftRow: any) => {
        return <NftEntity>{
          id: nftRow['nft_id'],
          name: nftRow['nft_name'],
          ipfsHash: nftRow['ipfs_hash'],
          metadata: nftRow['metadata'],
          dataUri: nftRow['data_uri'],
          contract: nftRow['contract'],
          tokenId: nftRow['token_id'],
          categories: nftRow['categories'].map((categoryRow: any) => {
            return <CategoryEntity>{
              name: categoryRow[0],
              description: categoryRow[1],
            }
          }),
        }
      })
    } catch (err) {
      Logger.error('Error on find nfts by ids query: ' + err)
      throw new HttpException(
        'Something went wrong',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }
}
