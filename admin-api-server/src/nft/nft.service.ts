import {
  Logger,
  HttpException,
  HttpStatus,
  Injectable,
  Inject,
} from '@nestjs/common';
import { PG_CONNECTION } from 'src/constants';
import { DbPool } from 'src/db.module';
import { STMResultStatus, StateTransitionMachine, Actor } from 'roles_stm';
import { User } from 'src/user/entities/user.entity';
import { NftEntity } from './entities/nft.entity';
import { RoleService } from 'src/role/role.service';
import { S3Service } from './s3.service';
import { Lock } from 'async-await-mutex-lock';
import { QueryParams } from 'src/types';
import { convertToSnakeCase, prepareFilterClause, prepareNftFilterClause } from 'src/utils';
import { UpdateNft } from './nft.controller';
const fs = require('fs');

const getSelectStatement = (
  whereClause = '',
  limitClause = '',
  sortField = 'id',
  sortDirection = 'ASC',
): string => `SELECT id, state, created_by, created_at, updated_at, json_agg(json_build_object('name', nftattr.name, 'value', nftattr.value)) as attributes
FROM nft
INNER JOIN nft_attribute nftattr on nftattr.nft_id = nft.id ${whereClause}
GROUP BY nft.id
ORDER BY ${sortField} ${sortDirection} ${limitClause}`;

const getSelectCountStatement = (
  whereClause = '',
): string => `SELECT COUNT(id) FROM nft
       inner join nft_attribute nftattr on nftattr.nft_id = nft.id ${whereClause}
       GROUP BY nft.id
       ORDER BY $1`;

@Injectable()
export class NftService {
  stm: StateTransitionMachine;
  nftLock: Lock<number>;
  CONTENT_KEYWORD = 'content_uri';

  constructor(
    @Inject(S3Service) private s3Service: S3Service,
    @Inject(PG_CONNECTION) private db: DbPool,
    private readonly roleService: RoleService,
  ) {
    const stmConfigFile = './config/stm_example.yaml';
    this.stm = new StateTransitionMachine(stmConfigFile);
    this.nftLock = new Lock<number>();
    fs.watch(stmConfigFile, (event: any, filename: any) => {
      if (event !== 'change') {
        return;
      }
      try {
        Logger.log('State transition machine config changed, reloading..');
        this.stm = new StateTransitionMachine(filename);
        Logger.log('State transition machine config reloaded');
      } catch (err: any) {
        Logger.warn(
          `State transition machine config reload failed, err: ${err}`,
        );
      }
    });
  }

  async create(creator: User): Promise<NftEntity> {
    try {
      const qryRes = await this.db.query(
        `
INSERT INTO nft (
  created_by, state
)
VALUES ($1, 'creation')
RETURNING id
    `,
        [creator.id],
      );
      return await this.getNft(creator, qryRes.rows[0].id);
    } catch (err: any) {
      Logger.error(`Unable to create new nft, err: ${err}`);
      throw new HttpException(
        'Unable to create new nft',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll({ range, sort, filter }: QueryParams): Promise<{ data: NftEntity[][]; count: any; }> {
    const { query: whereClause, params } = prepareFilterClause(filter)
    const limitClause =
      range.length === 2
        ? `LIMIT ${range[1] - range[0]} OFFSET ${range[0]}`
        : undefined;
    const sortField = sort && sort[0] ? convertToSnakeCase(sort[0]) : 'id';
    const sortDirection = sort && sort[1] ? sort[1] : 'ASC';

    const countResult = await this.db.query(
      getSelectCountStatement(whereClause),
      [sortField, ...params],
    );

    const result = await this.db.query<NftEntity[]>(
      getSelectStatement(whereClause, limitClause, sortField, sortDirection),
      params,
    );

    return { data: result.rows, count: countResult?.rows[0]?.count ?? 0 };
  }

  async findByIds(ids: number[], dbTx?: any): Promise<NftEntity[]> {
    const dbconn = dbTx || this.db;
    const qryRes = await dbconn.query(
      `
WITH attr AS (
  SELECT
    nft_id,
    ARRAY_AGG(ARRAY[name, value]) AS attributes
  FROM nft_attribute
  WHERE nft_id = ANY($1)
  GROUP BY nft_id
)
SELECT
  nft.id AS nft_id,
  nft.created_by,
  nft.created_at,
  nft.updated_at,
  nft.state,
  COALESCE(attr.attributes, ARRAY[]::TEXT[][]) AS attributes
FROM nft
LEFT JOIN attr
  ON nft.id = attr.nft_id
WHERE id = ANY($1)
ORDER BY id
    `,
      [ids],
    );
    if (qryRes.rowCount === 0) {
      return undefined;
    }
    return qryRes.rows.map((row: any) => {
      const nft = <NftEntity>{
        id: row['nft_id'],
        createdBy: row['created_by'],
        createdAt: Math.floor(row['created_at'].getTime() / 1000),
        updatedAt: Math.floor(row['updated_at'].getTime() / 1000),
        state: row['state'],
        attributes: {},
      };
      for (const [name, value] of row['attributes']) {
        nft.attributes[name] = JSON.parse(value);
      }
      return nft;
    });
  }

  async getNft(user: User, nftId: number) {
    const nfts = await this.findByIds([nftId]);
    if (nfts.length === 0) {
      throw new HttpException(`nft does not exist`, HttpStatus.BAD_REQUEST);
    }
    const nft = nfts[0];

    const actor = await this.getActorForNft(user, nft);

    return {
      ...nft,
      allowedActions: this.stm.getAllowedActions(actor, nft),
    };
  }

  async getActorForNft(user: User, nft: NftEntity): Promise<Actor> {
    const roles = await this.roleService.getLabels(user.roles);
    if (nft.createdBy === user.id) {
      roles.push('creator');
    }
    return new Actor(user.id, roles);
  }

  async setContent(
    user: User,
    nftId: number,
    picture: any,
  ): Promise<NftEntity> {
    await this.nftLock.acquire(nftId);
    try {
      // verify first that we are allowed to change the content, before uploading
      // to S3 (and potentially overwriting an earlier set content)
      const nft = await this.getNft(user, nftId);
      if (typeof nft === 'undefined') {
        throw new HttpException(`nft does not exist`, HttpStatus.BAD_REQUEST);
      }
      if (!nft.allowedActions.hasOwnProperty(this.CONTENT_KEYWORD)) {
        throw new HttpException(
          `attribute '${this.CONTENT_KEYWORD}' is not allowed to be set by you for nft with state '${nft.state}'`,
          HttpStatus.UNAUTHORIZED,
        );
      }

      const fileName = `nft_${nftId}`;
      // we'll simply store the uri as a pointer to the image in our own db
      const contentUri = await this.s3Service.uploadFile(picture, fileName);

      const updatableNft = {
        attribute: this.CONTENT_KEYWORD,
        value: JSON.stringify(contentUri)
      }

      return await this.apply(
        user,
        nftId,
        [updatableNft],
        false,
      );
    } finally {
      this.nftLock.release(nftId);
    }
  }

  transformFormDataToUpdatableNft(attrArray: string[], valueArray: any | any[]) {
    if (attrArray.length !== valueArray.length) {
      throw new HttpException('attribute and value should have the same length', HttpStatus.BAD_REQUEST)
    }
    let updatableNft: UpdateNft[] = [];

    for (const index in attrArray) {
      updatableNft.push({
        attribute: attrArray[index],
        value: valueArray[index]
      })
    }

    return updatableNft
  }

  async apply(
    user: User,
    nftId: number,
    keyValuePairs: UpdateNft[],
    lockNft = true,
  ): Promise<NftEntity> {
    if (lockNft) {
      await this.nftLock.acquire(nftId);
    }
    try {
      const nfts = await this.findByIds([nftId]);
      if (nfts.length === 0) {
        throw new HttpException(`nft does not exist`, HttpStatus.BAD_REQUEST);
      }
      const nft = nfts[0];
      const actor = await this.getActorForNft(user, nft);

      for (let { attribute, value } of keyValuePairs) {
        // Check if attribute is of type content in order to upload to ipfs
        if (attribute === this.CONTENT_KEYWORD) {
          const nft = await this.getNft(user, nftId);
          if (!nft.allowedActions.hasOwnProperty(this.CONTENT_KEYWORD)) {
            throw new HttpException(
              `attribute '${this.CONTENT_KEYWORD}' is not allowed to be set by you for nft with state '${nft.state}'`,
              HttpStatus.UNAUTHORIZED,
            );
          }
          const fileName = `nft_${nftId}`;
          // we'll simply store the uri as a pointer to the image in our own db
          const contentUri = await this.s3Service.uploadFile(value, fileName);
          attribute = contentUri
        }

        const stmRes = this.stm.tryAttributeApply(actor, nft, attribute, value);

        if (stmRes.status != STMResultStatus.OK) {
          switch (stmRes.status) {
            case STMResultStatus.NOT_ALLOWED:
              throw new HttpException(
                stmRes.message || '',
                HttpStatus.UNAUTHORIZED,
              );
            default:
              throw new HttpException(
                stmRes.message || '',
                HttpStatus.INTERNAL_SERVER_ERROR,
              );
          }
        }
      }

      await this.update(user, nft);
      return await this.getNft(user, nft.id);
    } catch (err: any) {
      throw err;
    } finally {
      if (lockNft) {
        this.nftLock.release(nftId);
      }
    }
  }

  async update(setBy: User, nft: NftEntity) {
    const attrNames = Object.keys(nft.attributes);
    const attrValues = attrNames.map((name: string) =>
      JSON.stringify(nft.attributes[name]),
    );

    const dbTx = await this.db.connect();
    try {
      await dbTx.query(`BEGIN`);
      dbTx.query(
        `
UPDATE nft
SET state = $2
WHERE id = $1
      `,
        [nft.id, nft.state],
      );
      await dbTx.query(
        `
INSERT INTO nft_attribute AS TARGET (
  nft_id, set_by, name, value
)
SELECT $1, $2, attr.name, attr.value
FROM UNNEST($3::text[], $4::text[]) attr(name, value)
ON CONFLICT ON CONSTRAINT nft_attribute_pkey DO UPDATE
SET
  value = EXCLUDED.value,
  set_at = now() AT TIME ZONE 'UTC'
WHERE TARGET.value != EXCLUDED.value
      `,
        [nft.id, setBy.id, attrNames, attrValues],
      );
      await dbTx.query(`COMMIT`);
    } catch (err: any) {
      Logger.error(`failed to update nft (id=${nft.id}), err: ${err}`);
      await dbTx.query(`ROLLBACK`);
      throw err;
    } finally {
      dbTx.release();
    }
  }
}
