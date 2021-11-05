import {
  HttpException,
  HttpStatus,
  Logger,
  Injectable,
  Inject,
} from '@nestjs/common'
import { NftEntity } from 'src/nft/entity/nft.entity'
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
    const offset = (params.page - 1) * params.pageSize
    const limit = params.pageSize

    try {
      return await this.conn.begin(async (sqlTx) => {
        const nftIds = await sqlTx<number[]>`
SELECT DISTINCT nft.id as nft_id
FROM nft
JOIN mtm_nft_category AS mtm
  ON mtm.nft_id = nft.id
JOIN nft_category AS cat
  ON mtm.nft_category_id = cat.id
WHERE cat.category IN (${params.categories})
ORDER BY nft.id
OFFSET ${offset}
LIMIT ${limit}
`
        if (nftIds.length == 0) {
          return []
        }
        console.log(nftIds)
        return this.findByIds(
          nftIds.map((row) => row.nft_id),
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

  async findAll(params: AllNftsParams): Promise<NftEntity[]> {
    if (params.page < 1 || params.pageSize < 1) {
      throw new HttpException('Bad page parameters', HttpStatus.BAD_REQUEST)
    }
    const offset = (params.page - 1) * params.pageSize
    const limit = params.pageSize

    try {
      return await this.conn.begin(async (sqlTx) => {
        const nftIds = await sqlTx<number[]>`
SELECT nft.id as nft_id
FROM nft
OFFSET ${offset}
LIMIT ${limit}
`
        if (nftIds.length == 0) {
          return []
        }
        console.log(nftIds)
        return this.findByIds(
          nftIds.map((row) => row.nft_id),
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

  async findByIds(nftIds: number[], dbConnection: any): Promise<NftEntity[]> {
    const qryRes = await dbConnection`
SELECT
  nft.id, nft_name, ipfs_hash, metadata, data_uri, contract, token_id,
  ARRAY_AGG(ARRAY[cat.category, cat.description]) AS categories
FROM nft
LEFT JOIN mtm_nft_category AS mtm
  ON mtm.nft_id = nft.id
LEFT JOIN nft_category AS cat
  ON mtm.nft_category_id = cat.id
WHERE nft.id IN (${nftIds})
GROUP BY
  nft.id, nft_name, ipfs_hash, metadata, data_uri, contract, token_id
ORDER BY nft.id
`
    return qryRes.map((nftRow) => {
      return {
        id: nftRow['id'],
        name: nftRow['nft_name'],
        ipfsHash: nftRow['ipfs_hash'],
        metadata: nftRow['metadata'],
        dataUri: nftRow['dataUri'],
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
  }
}
