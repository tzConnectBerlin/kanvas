import {
  HttpException,
  HttpStatus,
  Logger,
  Injectable,
  Inject,
} from '@nestjs/common'
import { NftEntity, NftEntityPage } from 'src/nft/entity/nft.entity'
import { FilterParams, AllNftsParams } from '../params'
import { PG_CONNECTION } from 'src/db.module'

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

  async filter(params: FilterParams): Promise<NftEntityPage> {
    if (params.page < 1 || params.pageSize < 1) {
      throw new HttpException('Bad page parameters', HttpStatus.BAD_REQUEST)
    }
    const orderByMapping = new Map([
      ['id', 'nft_id'],
      ['name', 'nft_name'],
      ['price', 'price'],
    ])
    if (!orderByMapping.has(params.orderBy)) {
      throw new HttpException(
        'Requested orderBy not supported',
        HttpStatus.BAD_REQUEST,
      )
    }

    const orderBy = orderByMapping.get(params.orderBy)
    const offset = (params.page - 1) * params.pageSize
    const limit = params.pageSize

    const client = await this.conn.connect()
    try {
      await client.query('BEGIN')
      const nftIds = await client.query(
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
          params.firstRequestAt,
        ],
      )

      const res = {
        currentPage: params.page,
        numberOfPages: 0,
        firstRequestAt: params.firstRequestAt,
        nfts: [],
      }
      if (nftIds.rows.length == 0) {
        return res
      }

      res.numberOfPages = Math.ceil(
        nftIds.rows[0].total_nft_count / params.pageSize,
      )
      res.nfts = await this.findByIds(
        nftIds.rows.map((row) => row.nft_id),
        orderBy,
        params.order,
        client,
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

  async findAll(params: AllNftsParams): Promise<NftEntityPage> {
    return this.filter({
      ...params,
      categories: undefined,
      address: undefined,
    })
  }

  async byId(id: number): Promise<NftEntity> {
    const nfts = await this.findByIds([id], 'nft_id', 'asc', this.conn)
    if (nfts.length == 0) {
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
    sql: any,
  ): Promise<NftEntity[]> {
    try {
      const nftsQryRes = await sql.query(
        `
SELECT nft_id, nft_name, ipfs_hash, metadata, data_uri, contract, token_id, categories
FROM nfts_by_id($1, $2, $3)`,
        [nftIds, orderBy, orderDirection],
      )
      console.log(nftsQryRes)
      return nftsQryRes.rows.map((nftRow) => {
        return {
          id: nftRow['nft_id'],
          name: nftRow['nft_name'],
          ipfsHash: nftRow['ipfs_hash'],
          metadata: nftRow['metadata'],
          dataUri: nftRow['data_uri'],
          contract: nftRow['contract'],
          tokenId: nftRow['token_id'],
          categories: nftRow['categories'].map((categoryRow) => {
            return {
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
