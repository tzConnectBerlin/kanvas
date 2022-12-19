import {
  HttpException,
  HttpStatus,
  Logger,
  Injectable,
  Inject,
} from '@nestjs/common';
import {
  CreateNft,
  CreateProxiedNft,
  NftEntity,
  NftFormats,
  NftEntityPage,
  OwnershipInfo,
} from '../entity/nft.entity.js';
import { CategoryEntity } from '../../category/entity/category.entity.js';
import { FilterParams } from '../params.js';
import {
  PG_CONNECTION,
  MINTER_ADDRESS,
  SEARCH_MAX_NFTS,
  SEARCH_SIMILARITY_LIMIT,
  ENDING_SOON_DURATION,
  TOKEN_ARTIFACT,
} from '../../constants.js';
import { CurrencyService, BASE_CURRENCY } from 'kanvas-api-lib';
import { sleep, maybe } from '../../utils.js';
import { NftIpfsService } from './ipfs.service.js';
import { DbTransaction, withTransaction } from '../../db.module.js';

@Injectable()
export class NftService {
  constructor(
    @Inject(PG_CONNECTION) private conn: any,
    private ipfsService: NftIpfsService,
    private currencyService: CurrencyService,
  ) {}

  async createNft(newNft: CreateNft) {
    const insertFormats = async (
      dbTx: DbTransaction,
      formats?: NftFormats,
    ): Promise<number[]> => {
      const formatIds: number[] = [];

      if (typeof formats === 'undefined') {
        return formatIds;
      }

      for (const contentName of Object.keys(formats)) {
        for (const attr of Object.keys(formats[contentName])) {
          await dbTx.query(
            `
INSERT INTO format (content_name, attribute, value)
VALUES ($1, $2, $3)
ON CONFLICT DO NOTHING
          `,
            [contentName, attr, JSON.stringify(formats[contentName][attr])],
          );
          formatIds.push(
            (
              await dbTx.query(
                `
SELECT
  id
FROM format
WHERE content_name = $1
  AND attribute = $2
          `,
                [contentName, attr],
              )
            ).rows[0]['id'],
          );
        }
      }
      return formatIds;
    };
    const insert = async (dbTx: DbTransaction) => {
      let onsaleFrom: Date | undefined;
      if (typeof newNft.onsaleFrom !== 'undefined') {
        onsaleFrom = new Date();
        onsaleFrom.setTime(newNft.onsaleFrom);
      }
      let onsaleUntil: Date | undefined;
      if (typeof newNft.onsaleUntil !== 'undefined') {
        onsaleUntil = new Date();
        onsaleUntil.setTime(newNft.onsaleUntil);
      }

      const formatIds = await insertFormats(dbTx, newNft.formats);

      await dbTx.query(
        `
INSERT INTO nft (
  id, signature, nft_name, artifact_uri, display_uri, thumbnail_uri, description, onsale_from, onsale_until, price, editions_size, metadata, proxy_nft_id, created_at
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, COALESCE(
    (SELECT created_at FROM nft WHERE id = $13), now() AT TIME ZONE 'UTC'
  ))
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
          this.currencyService.convertFromCurrency(newNft.price, BASE_CURRENCY),
          newNft.editionsSize,
          newNft.metadata,
          newNft.proxyNftId,
        ],
      );

      await dbTx.query(
        `
INSERT INTO mtm_nft_format (
  nft_id, format_id
)
SELECT $1, UNNEST($2::INTEGER[])
      `,
        [newNft.id, formatIds],
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
        dbTx,
      );

      const MAX_ATTEMPTS = 10;
      const BACKOFF_MS = 1000;
      let lastErr;
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
          lastErr = err;
        }
        sleep(BACKOFF_MS);
      }
      throw `failed to upload new nft to IPFS, final attempt's err: ${lastErr}`;
    };

    await withTransaction(this.conn, async (dbTx: DbTransaction) => {
      await insert(dbTx);
      await uploadToIpfs(dbTx);
    }).catch((err: any) => {
      Logger.error(`failed to publish nft (id=${newNft.id}), err: ${err}`);
      throw err;
    });

    Logger.log(`Created new NFT ${newNft.id}`);
  }

  async createProxiedNft(newNft: CreateProxiedNft) {
    const proxyNft = await this.byId(newNft.proxyNftId);

    await this.createNft({
      ...newNft,
      name: newNft.name ?? proxyNft.name,
      description: newNft.description ?? proxyNft.description,
      price: Number(proxyNft.price),
      editionsSize: 1,
    });

    await withTransaction(this.conn, async (dbTx: DbTransaction) => {
      await dbTx.query(
        `
INSERT INTO proxy_unfold (proxy_nft_id, unfold_nft_id)
VALUES ($1, $2)
        `,
        [newNft.proxyNftId, newNft.id],
      );

      await dbTx.query(
        `
UPDATE nft
SET editions_size = (SELECT count(1) FROM proxy_unfold WHERE proxy_nft_id = $1)
WHERE id = $1
      `,
        [newNft.proxyNftId],
      );
    });
  }

  async delistNft(nftId: number) {
    await withTransaction(this.conn, async (dbTx: DbTransaction) => {
      const tablesNftIdField: { [key: string]: string } = {
        nft: 'id',
        mtm_kanvas_user_nft: 'nft_id',
        mtm_nft_category: 'nft_id',
        mtm_nft_order_nft: 'nft_id',
        nft_order_delivery: 'order_nft_id',
        mtm_nft_format: 'nft_id',
      };
      const tables = [
        'mtm_nft_format',
        'nft_order_delivery',
        'mtm_nft_order_nft',
        'mtm_kanvas_user_nft',
        'mtm_nft_category',
        'nft',
      ];

      for (const table of tables) {
        const nftIdField = tablesNftIdField[table];

        await dbTx.query(
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

  async findKeysWithAddress(address: string): Promise<Record<string, any>> {
    const getKeysRawResult = await this.conn.query(
      `
SELECT
  idx_nat AS token_id,
  nat AS count
FROM token_gate."storage.ledger_live"
WHERE idx_address = $1
`,
      [address],
    );

    const getKeysDataRawResult = await this.conn.query(
      `
SELECT
  claims.token_id AS token_id,
  claims.token_type AS token_type,
  mint.command->'args'->>'metadata_ipfs' AS metadata_ipfs,
  mint.included_in AS mint_hash
FROM claims
JOIN peppermint.operations AS mint
  ON  (mint.command->'args'->>'token_id')::int = claims.token_id
  AND mint.command->>'name' = 'create_and_mint'
WHERE claims.token_id = ANY($1)
ORDER BY claims.token_id
      `,
      [getKeysRawResult.rows.map((row: any) => Number(row.token_id))],
    );

    return getKeysDataRawResult.rows.map((r: any) => {
      return {
        token_type: r['token_type'],
        token_id: r['token_id'],
  
        name: 'The Keys: Officially licensed Manchester United digital collectibles',
        description:
          'The first-ever official Manchester United digital collectible is a gift to fans and is available in Classic, Rare and Ultra Rare versions. Powered by Tezos and brought to you by Tezos ecosystem companies.',
        categories: ['Sports'],
        edition_size: 1,
  
        artifact: TOKEN_ARTIFACT[r['token_type']],
  
        mint_operation_hash: r['mint_hash'],
      };
    });
  };

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

    const proxiesFolded: boolean | undefined =
      (filters.proxyFolding ?? 'both') === 'both'
        ? undefined
        : filters.proxyFolding === 'fold';

    try {
      const nftIds = await this.conn.query(
        `
SELECT nft_id, total_nft_count
FROM nft_ids_filtered($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          filters.userAddress,
          filters.categories,
          filters.priceAtLeast,
          filters.priceAtMost,
          filters.availability,
          proxiesFolded,
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
    currency: string = BASE_CURRENCY,
    includeRecvForAddress?: string,
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
    return nfts[0];
  }

  async incrementNftViewCount(id: number) {
    try {
      await this.conn.query(
        `
UPDATE nft
SET view_count = view_count + 1
WHERE id = $1
`,
        [id],
      );
    } catch (err: any) {
      Logger.error(
        `failed to increase nft view count, err: ${JSON.stringify(err)}`,
      );
    }
  }

  async findByIds(
    nftIds: number[],
    forRecvAddr?: string,
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
  is_proxy,
  proxy_nft_id,

  editions_size,
  price,
  categories,

  onsale_from,
  onsale_until,

  formats,
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

        const onsaleFrom = maybe(nftRow['onsale_from'], (t) =>
          Math.floor(t.getTime() / 1000),
        );
        const onsaleUntil = maybe(nftRow['onsale_until'], (t) =>
          Math.floor(t.getTime() / 1000),
        );

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
          isProxy: nftRow['is_proxy'],
          proxyNftId: maybe(nftRow['proxy_nft_id'], (x) => x),

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
          formats: maybe(nftRow['formats'], (formats) =>
            formats.reduce((formats: NftFormats, format: any) => {
              if (typeof formats[format[0]] === 'undefined') {
                formats[format[0]] = {};
              }
              formats[format[0]][format[1]] = format[2];
              return formats;
            }, {}),
          ),
          metadata: nftRow['metadata'],
          editionsSize: editions,
          editionsAvailable: editions - (reserved + owned),
          editionsSold: owned,

          createdAt: Math.floor(nftRow['nft_created_at'].getTime() / 1000),
          launchAt: onsaleFrom,
          onsaleFrom,
          onsaleUntil,

          mintOperationHash: nftRow['mint_op_hash'],
          ownershipInfo: nftRow['owned_recv_op_hashes']?.map(
            (opHash: string) =>
              <OwnershipInfo>{
                status: 'owned',
                receivalOperationHash: opHash,
              },
          ),
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
