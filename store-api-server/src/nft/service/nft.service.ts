import {
  HttpException,
  HttpStatus,
  Logger,
  Injectable,
  Inject,
} from '@nestjs/common';
import { CreateNft, NftEntity, NftEntityPage } from '../entity/nft.entity.js';
import { CategoryEntity } from '../../category/entity/category.entity.js';
import { CategoryService } from '../../category/service/category.service.js';
import { FilterParams } from '../params.js';
import {
  PG_CONNECTION,
  MINTER_ADDRESS,
  SEARCH_MAX_NFTS,
  SEARCH_SIMILARITY_LIMIT,
  ENDING_SOON_DURATION,
} from '../../constants.js';
import { CurrencyService, BASE_CURRENCY } from 'kanvas-api-lib';
import { sleep } from '../../utils.js';
import { IpfsService } from './ipfs.service.js';
import { DbTransaction, withTransaction } from '../../db.module.js';

@Injectable()
export class NftService {
  constructor(
    @Inject(PG_CONNECTION) private conn: any,
    private readonly categoryService: CategoryService,
    private ipfsService: IpfsService,
    private currencyService: CurrencyService,
  ) {}

  async createNft(newNft: CreateNft) {
    const insert = async (dbTx: any) => {
      let onsaleFrom: Date | undefined = undefined;
      if (typeof newNft.onsaleFrom !== 'undefined') {
        onsaleFrom = new Date();
        onsaleFrom.setTime(newNft.onsaleFrom);
      }
      let onsaleUntil: Date | undefined = undefined;
      if (typeof newNft.onsaleUntil !== 'undefined') {
        onsaleUntil = new Date();
        onsaleUntil.setTime(newNft.onsaleUntil);
      }

      await dbTx.query(
        `
INSERT INTO nft (
  id, signature, nft_name, artifact_uri, display_uri, thumbnail_uri, description, onsale_from, onsale_until, price, editions_size, metadata
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `,

        [
          newNft.id,
          newNft.signature,
          newNft.name,
          newNft.artifactUri,
          newNft.displayUri,
          newNft.thumbnailUri,
          newNft.description,
          onsaleFrom?.toUTCString(),
          onsaleUntil?.toUTCString(),
          newNft.price,
          newNft.editionsSize,
          newNft.metadata,
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
      const nftEntity: NftEntity = await this.byId(
        newNft.id,
        BASE_CURRENCY,
        undefined,
        false,
        dbTx,
      );

      const MAX_ATTEMPTS = 10;
      const BACKOFF_MS = 1000;
      for (let i = 0; i < MAX_ATTEMPTS; i++) {
        try {
          await this.ipfsService.uploadNft(nftEntity, dbTx);
          return;
        } catch (err: any) {
          Logger.warn(
            `failed to upload new nft to IPFS (attempt ${
              i + 1
            }/${MAX_ATTEMPTS}), err: ${err}`,
          );
        }
        sleep(BACKOFF_MS);
      }
      throw `failed to upload new nft to IPFS`;
    };

    return await withTransaction(this.conn, async (dbTx: DbTransaction) => {
      await insert(dbTx);
      await uploadToIpfs(dbTx);
    }).catch((err: any) => {
      Logger.error(`failed to publish nft (id=${newNft.id}), err: ${err}`);
      throw err;
    });

    Logger.log(`Created new NFT ${newNft.id}`);
  }

  async delistNft(nftId: number) {
    await withTransaction(this.conn, async (dbTx: DbTransaction) => {
      const tablesNftIdField: { [key: string]: string } = {
        nft: 'id',
        mtm_kanvas_user_nft: 'nft_id',
        mtm_nft_category: 'nft_id',
        mtm_nft_order_nft: 'nft_id',
      };
      const tables = [
        'mtm_nft_order_nft',
        'mtm_kanvas_user_nft',
        'mtm_nft_category',
        'nft',
      ];

      for (const table of tables) {
        const nftIdField = tablesNftIdField[table];

        const qryRes = await dbTx.query(
          `
INSERT INTO __${table}_delisted
SELECT *
FROM ${table}
WHERE ${nftIdField} = $1
        `,
          [nftId],
        );
      }
      for (const table of tables) {
        const nftIdField = tablesNftIdField[table];

        await dbTx.query(
          `
DELETE FROM ${table}
WHERE ${nftIdField} = $1
        `,
          [nftId],
        );
      }
    });
  }

  async relistNft(nftId: number) {
    await withTransaction(this.conn, async (dbTx: DbTransaction) => {
      const tablesNftIdField: { [key: string]: string } = {
        nft: 'id',
        mtm_kanvas_user_nft: 'nft_id',
        mtm_nft_category: 'nft_id',
        mtm_nft_order_nft: 'nft_id',
      };
      const tables = [
        'nft',
        'mtm_nft_order_nft',
        'mtm_kanvas_user_nft',
        'mtm_nft_category',
      ];

      for (const table of tables) {
        const nftIdField = tablesNftIdField[table];

        await dbTx.query(
          `

INSERT INTO ${table}
SELECT *
FROM __${table}_delisted
WHERE ${nftIdField} = $1
        `,
          [nftId],
        );
      }
      for (const table of tables) {
        const nftIdField = tablesNftIdField[table];

        await dbTx.query(
          `
DELETE FROM __${table}_delisted
WHERE ${nftIdField} = $1
        `,
          [nftId],
        );
      }
    });
  }

  async search(str: string, currency: string): Promise<NftEntity[]> {
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
      undefined,
      'nft_id',
      'asc',
      currency,
    );

    return nftIds.rows
      .map((row: any) => nfts.find((nft) => nft.id === row.id))
      .filter(Boolean);
  }

  async findNftsWithFilter(
    filters: FilterParams,
    currency: string,
  ): Promise<NftEntityPage> {
    const orderByMapping = new Map([
      ['id', 'nft_id'],
      ['createdAt', 'nft_created_at'],
      ['name', 'nft_name'],
      ['price', 'price'],
      ['views', 'view_count'],
    ]);

    const orderBy = orderByMapping.get(filters.orderBy);
    if (typeof orderBy === 'undefined') {
      Logger.error(
        'Error in nft.filter(), orderBy unmapped, request.orderBy: ' +
          filters.orderBy,
      );
      throw new HttpException(
        'Something went wrong',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (typeof filters.priceAtLeast !== 'undefined') {
      filters.priceAtLeast = this.currencyService.convertFromCurrency(
        filters.priceAtLeast,
        currency,
      );
    }
    if (typeof filters.priceAtMost !== 'undefined') {
      filters.priceAtMost = this.currencyService.convertFromCurrency(
        filters.priceAtMost,
        currency,
      );
    }

    const offset = (filters.page - 1) * filters.pageSize;
    const limit = filters.pageSize;

    let untilNft: string | undefined = undefined;
    if (typeof filters.firstRequestAt === 'number') {
      untilNft = new Date(filters.firstRequestAt * 1000).toISOString();
    }

    try {
      const nftIds = await this.conn.query(
        `
SELECT nft_id, total_nft_count
FROM nft_ids_filtered($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          filters.userAddress,
          filters.categories,
          filters.priceAtLeast,
          filters.priceAtMost,
          filters.availability,
          ENDING_SOON_DURATION,
          orderBy,
          filters.orderDirection,
          offset,
          limit,
          untilNft,
          MINTER_ADDRESS,
        ],
      );
      const priceBounds = await this.conn.query(
        `
SELECT min_price, max_price
FROM price_bounds($1, $2, $3, $4, $5)`,
        [
          filters.userAddress,
          filters.categories,
          filters.availability,
          ENDING_SOON_DURATION,
          untilNft,
        ],
      );

      const res = <NftEntityPage>{
        currentPage: filters.page,
        numberOfPages: 0,
        totalNftCount: 0,
        firstRequestAt: filters.firstRequestAt,
        nfts: [],
        lowerPriceBound: this.currencyService.convertToCurrency(
          Number(priceBounds.rows[0].min_price),
          currency,
        ),
        upperPriceBound: this.currencyService.convertToCurrency(
          Number(priceBounds.rows[0].max_price),
          currency,
        ),
      };
      if (nftIds.rows.length === 0) {
        return res;
      }

      res.totalNftCount = Number(nftIds.rows[0].total_nft_count);
      res.numberOfPages = Math.ceil(res.totalNftCount / filters.pageSize);
      res.nfts = await this.findByIds(
        nftIds.rows.map((row: any) => row.nft_id),
        filters.userAddress,
        orderBy,
        filters.orderDirection,
        currency,
      );
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
    currency: string,
    includeRecvForAddress?: string,
    incrViewCount: boolean = true,
    dbConn: any = this.conn,
  ): Promise<NftEntity> {
    const nfts = await this.findByIds(
      [id],
      includeRecvForAddress,
      'nft_id',
      'asc',
      currency,
      false,
      dbConn,
    );
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

  async findByIds(
    nftIds: number[],
    forRecvAddr: string | undefined,
    orderBy: string = 'nft_id',
    orderDirection: string = 'asc',
    currency: string = BASE_CURRENCY,
    inBaseUnit: boolean = false,
    dbConn: any = this.conn,
  ): Promise<NftEntity[]> {
    try {
      const nftsQryRes = await dbConn.query(
        `
SELECT
  nft_id,
  nft_created_at,
  nft_name,
  description,

  editions_size,
  price,
  categories,

  onsale_from,
  onsale_until,

  metadata,

  metadata_ipfs,
  artifact_ipfs,
  display_ipfs,
  thumbnail_ipfs,

  artifact_uri,
  display_uri,
  thumbnail_uri,

  editions_reserved,
  editions_owned,

  mint_op_hash,
  owned_recv_op_hashes
FROM nfts_by_id($1, $2, $3, $4)`,
        [nftIds, orderBy, orderDirection, forRecvAddr],
      );
      return nftsQryRes.rows.map((nftRow: any) => {
        const editions = Number(nftRow['editions_size']);
        const reserved = Number(nftRow['editions_reserved']);
        const owned = Number(nftRow['editions_owned']);

        const launchAtMilliUnix = nftRow['onsale_from']?.getTime() || 0;
        const onsaleUntilMilliUnix =
          nftRow['onsale_until']?.getTime() || undefined;

        let metadataIpfs = null;
        let artifactIpfs = null;
        let displayIpfs = null;
        let thumbnailIpfs = null;
        if (owned > 0) {
          metadataIpfs = nftRow['metadata_ipfs'];
          artifactIpfs = nftRow['artifact_ipfs'];
          displayIpfs = nftRow['display_ipfs'];
          thumbnailIpfs = nftRow['thumbnail_ipfs'];
        }

        const nft = <NftEntity>{
          id: nftRow['nft_id'],
          name: nftRow['nft_name'],
          description: nftRow['description'],

          ipfsHash: metadataIpfs, // note: deprecated by metadataIpfs
          metadataIpfs: metadataIpfs,
          artifactIpfs: artifactIpfs,
          displayIpfs: displayIpfs,
          thumbnailIpfs: thumbnailIpfs,

          artifactUri: nftRow['artifact_uri'],
          displayUri: nftRow['display_uri'],
          thumbnailUri: nftRow['thumbnail_uri'],

          price: this.currencyService.convertToCurrency(
            Number(nftRow['price']),
            currency,
            inBaseUnit,
          ),
          categories: nftRow['categories'].map((categoryRow: any) => {
            return <CategoryEntity>{
              id: Number(categoryRow[0]),
              name: categoryRow[1],
              description: categoryRow[2],
            };
          }),
          metadata: nftRow['metadata'],
          editionsSize: editions,
          editionsAvailable: editions - (reserved + owned),

          createdAt: Math.floor(nftRow['nft_created_at'].getTime() / 1000),
          launchAt: Math.floor(launchAtMilliUnix / 1000),
          onsaleUntil: onsaleUntilMilliUnix
            ? Math.floor(onsaleUntilMilliUnix / 1000)
            : undefined,

          mintOpHash: nftRow['mint_op_hash'],
          ownedRecvOpHashes: nftRow['owned_recv_op_hashes'],
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
