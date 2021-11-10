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

  async filter(params: FilterParams): Promise<NftEntity[]> {
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

    try {
      return await this.conn.begin(async (sqlTx) => {
        const nftIds = await sqlTx<number[]>`
SELECT DISTINCT nft.id as nft_id, nft_name, price
FROM nft
JOIN mtm_nft_category AS mtm
  ON mtm.nft_id = nft.id
JOIN nft_category AS cat
  ON mtm.nft_category_id = cat.id
WHERE cat.category IN (${params.categories})
ORDER BY ${sqlTx(orderBy)} ${sqlTx(params.order)}, nft_id
OFFSET ${offset}
LIMIT ${limit}
`
        if (nftIds.length == 0) {
          return []
        }
        console.log(nftIds)
        return this.findByIds(
          nftIds.map((row) => row.nft_id),
          orderBy,
          params.order,
          sqlTx,
        )
      })
    } catch (err) {
      Logger.error('Error on nft filtered query, err: ' + err)
      throw new HttpException(
        'Something went wrong',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  async findAll(params: AllNftsParams): Promise<NftEntityPage> {
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

    try {
      return await this.conn.begin(async (sqlTx) => {
        const nftIds = await sqlTx<number[]>`
SELECT id as nft_id, name, price
FROM nft
ORDER BY ${sqlTx(orderBy)} ${sqlTx(params.order)}, nft.id
OFFSET ${offset}
LIMIT ${limit}
`
        if (nftIds.length == 0) {
          return []
        }
        const res = {
          firstId: nftIds[0].nft_id,
          data: await this.findByIds(
            nftIds.map((row) => row.nft_id),
            orderBy,
            params.order,
            sqlTx,
          ),
        }
        console.log(res)
        return res
      })
    } catch (err) {
      Logger.error('Error on nft filtered query, err: ' + err)
      throw new HttpException(
        'Something went wrong',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
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
      const qryRes = await sql`
SELECT
  nft.id as nft_id, nft_name, ipfs_hash, metadata, data_uri, contract, token_id,
  ARRAY_AGG(ARRAY[category, cat.description]) AS categories
FROM nft
LEFT JOIN mtm_nft_category AS mtm
  ON mtm.nft_id = nft.id
LEFT JOIN nft_category AS cat
  ON mtm.nft_category_id = cat.id
WHERE nft.id IN (${nftIds})
GROUP BY
  nft.id, nft_name, ipfs_hash, metadata, data_uri, contract, token_id
ORDER BY ${sql(orderBy)} ${sql(orderDirection)}, nft.id
`
      console.log(qryRes)
      return qryRes.map((nftRow) => {
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
