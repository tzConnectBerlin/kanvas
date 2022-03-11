import {
  HttpException,
  HttpStatus,
  Logger,
  Injectable,
  Inject,
} from '@nestjs/common';
import { CreateNft, NftEntity, NftEntityPage } from 'src/nft/entity/nft.entity';
import { CategoryEntity } from 'src/category/entity/category.entity';
import { CategoryService } from 'src/category/service/category.service';
import { FilterParams } from '../params';
import {
  PG_CONNECTION,
  MINTER_ADDRESS,
  MINTER_PUBLIC_KEY,
  SEARCH_MAX_NFTS,
  SEARCH_SIMILARITY_LIMIT,
} from 'src/constants';
import { sleep } from 'src/utils';
import { cryptoUtils } from 'sotez';
import { IpfsService } from './ipfs.service';

@Injectable()
export class NftService {
  constructor(
    @Inject(PG_CONNECTION) private conn: any,
    private readonly categoryService: CategoryService,
    private ipfsService: IpfsService,
  ) {}

  async createNft(newNft: CreateNft) {
    const validate = async () => {
      if (
        !(await cryptoUtils.verify(
          `${newNft.id}`,
          `${newNft.signature}`,
          MINTER_PUBLIC_KEY,
        ))
      ) {
        throw new HttpException('Invalid signature', HttpStatus.UNAUTHORIZED);
      }
    };

    const insert = async (dbTx: any) => {
      const launchAt = new Date();
      launchAt.setTime(newNft.launchAt);

      await dbTx.query(
        `
INSERT INTO nft (
  id, signature, nft_name, artifact_uri, display_uri, thumbnail_uri, description, launch_at, price, editions_size
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,

        [
          newNft.id,
          newNft.signature,
          newNft.name,
          newNft.artifactUri,
          newNft.displayUri,
          newNft.thumbnailUri,
          newNft.description,
          launchAt.toUTCString(),
          newNft.price,
          newNft.editionsSize,
        ],
      );

      await dbTx.query(
        `
INSERT INTO mtm_nft_category (
  nft_id, nft_category_id
)
SELECT $1, UNNEST($2::INTEGER[])
      `,
        [newNft.id, newNft.categories],
      );
    };

    const uploadToIpfs = async (dbTx: any) => {
      const nftEntity: NftEntity = await this.byId(newNft.id, false, dbTx);

      const MAX_RETRIES = 10;
      const BACKOFF = 1000;
      for (let i = 0; i < 10; i++) {
        try {
          this.ipfsService.uploadNft(nftEntity, dbTx);
          return;
        } catch (err: any) {
          Logger.warn(
            `failed to upload new nft to IPFS (attempt ${
              i + 1
            }/${MAX_RETRIES}), err: ${err}`,
          );
        }
        sleep(BACKOFF);
      }
    };

    await validate();

    const dbTx = await this.conn.connect();
    try {
      await dbTx.query(`BEGIN`);

      await insert(dbTx);
      await uploadToIpfs(dbTx);

      await dbTx.query(`COMMIT`);
      Logger.log(`Created new NFT ${newNft.id}`);
    } catch (err: any) {
      Logger.error(`failed to publish nft (id=${newNft.id}), err: ${err}`);
      await dbTx.query(`ROLLBACK`);
      throw err;
    } finally {
      dbTx.release();
    }
  }

  async search(str: string): Promise<NftEntity[]> {
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
    );

    const nfts = await this.findByIds(
      nftIds.rows.map((row: any) => row.id),
      'nft_id',
      'asc',
    );

    return nftIds.rows
      .map((row: any) => nfts.find((nft) => nft.id === row.id))
      .filter(Boolean);
  }

  async findNftsWithFilter(params: FilterParams): Promise<NftEntityPage> {
    const orderByMapping = new Map([
      ['id', 'nft_id'],
      ['createdAt', 'nft_created_at'],
      ['name', 'nft_name'],
      ['price', 'price'],
      ['views', 'view_count'],
    ]);

    const orderBy = orderByMapping.get(params.orderBy);
    if (typeof orderBy === 'undefined') {
      Logger.error(
        'Error in nft.filter(), orderBy unmapped, request.orderBy: ' +
          params.orderBy,
      );
      throw new HttpException(
        'Something went wrong',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const offset = (params.page - 1) * params.pageSize;
    const limit = params.pageSize;

    let untilNft: string | undefined = undefined;
    if (typeof params.firstRequestAt === 'number') {
      untilNft = new Date(params.firstRequestAt * 1000).toISOString();
    }

    try {
      const nftIds = await this.conn.query(
        `
SELECT nft_id, total_nft_count
FROM nft_ids_filtered($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
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
          MINTER_ADDRESS,
        ],
      );
      const priceBounds = await this.conn.query(
        `
SELECT min_price, max_price
FROM price_bounds($1, $2, $3)`,
        [params.userAddress, params.categories, untilNft],
      );

      const res = <NftEntityPage>{
        currentPage: params.page,
        numberOfPages: 0,
        firstRequestAt: params.firstRequestAt,
        nfts: [],
        lowerPriceBound: Number(priceBounds.rows[0].min_price),
        upperPriceBound: Number(priceBounds.rows[0].max_price),
      };
      if (nftIds.rows.length === 0) {
        return res;
      }

      res.numberOfPages = Math.ceil(
        nftIds.rows[0].total_nft_count / params.pageSize,
      );
      res.nfts = await this.findByIds(
        nftIds.rows.map((row: any) => row.nft_id),
        orderBy,
        params.orderDirection,
      );
      if (typeof params.userAddress !== 'undefined') {
        await this.#addNftOwnerStatus(params.userAddress, res.nfts);
      }
      return res;
    } catch (err) {
      Logger.error('Error on nft filtered query, err: ' + err);
      throw new HttpException(
        'Something went wrong',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async byId(
    id: number,
    incrViewCount: boolean = true,
    dbConn: any = this.conn,
  ): Promise<NftEntity> {
    const nfts = await this.findByIds([id], 'nft_id', 'asc', dbConn);
    if (nfts.length === 0) {
      throw new HttpException(
        'NFT with the requested id does not exist',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (incrViewCount) {
      this.#incrementNftViewCount(id);
    }
    return nfts[0];
  }

  async #incrementNftViewCount(id: number) {
    this.conn.query(
      `
UPDATE nft
SET view_count = view_count + 1
WHERE id = $1
`,
      [id],
    );
  }

  async getNftOwnerStatus(address: string, nftIds: number[]) {
    const qryRes = await this.conn.query(
      `
SELECT
  idx_assets_nat AS nft_id,
  'owned' AS owner_status,
  assets_nat AS num_editions
FROM onchain_kanvas."storage.ledger_live" AS ledger_now
WHERE ledger_now.idx_assets_address = $2
  AND ledger_now.idx_assets_nat = ANY($3)

UNION ALL

SELECT
  nft_id,
  'pending' AS owner_status,
  purchased_editions_pending_transfer(nft_id, $2, $1) as num_editions
FROM UNNEST($3::integer[]) as nft_id

ORDER BY 1
`,
      [MINTER_ADDRESS, address, nftIds],
    );
    const ownerStatuses: any = {};
    for (const row of qryRes.rows) {
      ownerStatuses[row.nft_id] = [
        ...(ownerStatuses[row.nft_id] || []),
        ...Array(Number(row.num_editions)).fill(row.owner_status),
      ];
    }
    return ownerStatuses;
  }

  async #addNftOwnerStatus(address: string, nfts: NftEntity[]) {
    const ownerStatuses = await this.getNftOwnerStatus(
      address,
      nfts.map((nft: NftEntity) => nft.id),
    );
    for (const nft of nfts) {
      nft.ownerStatuses = ownerStatuses[nft.id];
    }
  }

  async findByIds(
    nftIds: number[],
    orderBy: string = 'nft_id',
    orderDirection: string = 'asc',
    dbConn: any = this.conn,
  ): Promise<NftEntity[]> {
    try {
      const nftsQryRes = await dbConn.query(
        `
SELECT
  nft_id,
  nft_name,
  description,
  ipfs_hash,
  artifact_uri,
  display_uri,
  thumbnail_uri,
  price,
  categories,
  editions_size,
  editions_reserved,
  editions_owned,
  nft_created_at,
  launch_at
FROM nfts_by_id($1, $2, $3)`,
        [nftIds, orderBy, orderDirection],
      );
      return nftsQryRes.rows.map((nftRow: any) => {
        const editions = Number(nftRow['editions_size']);
        const reserved = Number(nftRow['editions_reserved']);
        const owned = Number(nftRow['editions_owned']);

        const nft = <NftEntity>{
          id: nftRow['nft_id'],
          name: nftRow['nft_name'],
          description: nftRow['description'],
          ipfsHash: owned === 0 ? null : nftRow['ipfs_hash'], // Hide the IPFS hash until first purchase (delay irreversable publishing of the NFT In our name for as long as possible)
          artifactUri: nftRow['artifact_uri'],
          displayUri: nftRow['display_uri'],
          thumbnailUri: nftRow['thumbnail_uri'],
          price: Number(nftRow['price']),
          editionsSize: editions,
          editionsAvailable: editions - (reserved + owned),
          createdAt: Math.floor(nftRow['nft_created_at'].getTime() / 1000),
          launchAt: Math.floor(nftRow['launch_at'].getTime() / 1000),
          categories: nftRow['categories'].map((categoryRow: any) => {
            return <CategoryEntity>{
              id: Number(categoryRow[0]),
              name: categoryRow[1],
              description: categoryRow[2],
            };
          }),
        };

        nft.displayUri ??= nft.artifactUri;
        nft.thumbnailUri ??= nft.displayUri;

        return nft;
      });
    } catch (err) {
      Logger.error('Error on find nfts by ids query: ' + err);
      throw new HttpException(
        'Something went wrong',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
