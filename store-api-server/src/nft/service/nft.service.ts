import {
  HttpException,
  HttpStatus,
  Logger,
  Injectable,
  Inject,
} from '@nestjs/common'
import {
  NftEntity,
  NftEntityPage,
  SearchResult,
} from 'src/nft/entity/nft.entity'
import { CategoryEntity } from 'src/category/entity/category.entity'
import { FilterParams, PaginationParams } from '../params'
import {
  PG_CONNECTION,
  SEARCH_MAX_NFTS,
  SEARCH_MAX_CATEGORIES,
  SEARCH_SIMILARITY_LIMIT,
} from '../../constants'

@Injectable()
export class NftService {
  constructor(@Inject(PG_CONNECTION) private conn: any) {}

  async create(_nft: NftEntity): Promise<NftEntity> {
    throw new Error(
      "Not yet implemented - let's implement it when we need it rather than have a big generated code blob",
    )
  }

  async search(str: string): Promise<SearchResult> {
    const nftIds = await this.conn.query(
      `
SELECT id
FROM (
  SELECT
    id,
    view_count,
    GREATEST(
      word_similarity($1, nft_name),
      word_similarity($1, description)
    ) AS similarity
  FROM nft
) AS inner_query
WHERE similarity >= $2
ORDER BY similarity DESC, view_count DESC
LIMIT $3
    `,
      [str, SEARCH_SIMILARITY_LIMIT, SEARCH_MAX_NFTS],
    )

    const categoryIds = await this.conn.query(
      `
SELECT id, category AS name, description
FROM (
  SELECT
    id,
    category,
    description,
    GREATEST(
      word_similarity($1, category),
      word_similarity($1, description)
    ) AS similarity
  FROM nft_category
) AS inner_query
WHERE similarity >= $2
ORDER BY similarity DESC, id
LIMIT $3
    `,
      [str, SEARCH_SIMILARITY_LIMIT, SEARCH_MAX_CATEGORIES],
    )

    const nfts = await this.findByIds(
      nftIds.rows.map((row: any) => row.id),
      'nft_id',
      'asc',
    )

    return {
      nfts: nftIds.rows
        .map((row: any) => nfts.find((nft) => nft.id === row.id))
        .filter(Boolean),
      categories: categoryIds.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
      })),
    }
  }

  async findNftsWithFilter(params: FilterParams): Promise<NftEntityPage> {
    const orderByMapping = new Map([
      ['id', 'nft_id'],
      ['createdAt', 'nft_created_at'],
      ['name', 'nft_name'],
      ['price', 'price'],
      ['views', 'view_count'],
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
FROM nft_ids_filtered($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          params.userAddress,
          params.categories,
          params.priceAtLeast,
          params.priceAtMost,
          params.availability,
          orderBy,
          params.orderDirection,
          offset,
          limit,
          untilNft,
        ],
      )
      const priceBounds = await this.conn.query(
        `
SELECT min_price, max_price
FROM price_bounds($1, $2, $3)`,
        [params.userAddress, params.categories, untilNft],
      )

      const res = <NftEntityPage>{
        currentPage: params.page,
        numberOfPages: 0,
        firstRequestAt: params.firstRequestAt,
        nfts: [],
        lowerPriceBound: Number(priceBounds.rows[0].min_price),
        upperPriceBound: Number(priceBounds.rows[0].max_price),
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
        params.orderDirection,
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
    this.incrementNftViewCount(id)
    return nfts[0]
  }

  async incrementNftViewCount(id: number) {
    this.conn.query(
      `
UPDATE nft
SET view_count = view_count + 1
WHERE id = $1
`,
      [id],
    )
  }

  async findByIds(
    nftIds: number[],
    orderBy: string,
    orderDirection: string,
  ): Promise<NftEntity[]> {
    try {
      const nftsQryRes = await this.conn.query(
        `
SELECT
  nft_id,
  nft_name,
  description,
  ipfs_hash,
  metadata,
  data_uri,
  price,
  contract,
  token_id,
  categories,
  editions_size,
  editions_available,
  nft_created_at,
  launch_at
FROM nfts_by_id($1, $2, $3)`,
        [nftIds, orderBy, orderDirection],
      )
      return nftsQryRes.rows.map((nftRow: any) => {
        return <NftEntity>{
          id: nftRow['nft_id'],
          name: nftRow['nft_name'],
          description: nftRow['description'],
          ipfsHash: nftRow['ipfs_hash'],
          metadata: nftRow['metadata'],
          dataUri: nftRow['data_uri'],
          price: Number(nftRow['price']),
          contract: nftRow['contract'],
          tokenId: nftRow['token_id'],
          editionsSize: Number(nftRow['editions_size']),
          editionsAvailable: Number(nftRow['editions_available']),
          createdAt: Math.floor(nftRow['nft_created_at'].getTime() / 1000),
          launchAt: Math.floor(nftRow['launch_at'].getTime() / 1000),
          categories: nftRow['categories'].map((categoryRow: any) => {
            return <CategoryEntity>{
              id: Number(categoryRow[0]),
              name: categoryRow[1],
              description: categoryRow[2],
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
