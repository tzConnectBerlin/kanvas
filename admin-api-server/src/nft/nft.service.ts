import {
  Logger,
  HttpException,
  HttpStatus,
  Injectable,
  Inject,
} from '@nestjs/common';
import { NFT_IMAGE_PREFIX, PG_CONNECTION } from 'src/constants';
import { DbPool } from 'src/db.module';
import { STMResultStatus, StateTransitionMachine, Actor } from 'roles_stm';
import { User } from 'src/user/entities/user.entity';
import { NftEntity } from './entities/nft.entity';
import { RoleService } from 'src/role/role.service';
import { S3Service } from './s3.service';
import { QueryParams } from 'src/types';
import { Lock } from 'async-await-mutex-lock';
const fs = require('fs');

@Injectable()
export class NftService {
  stm: StateTransitionMachine;
  nftLock: Lock<number>;

  constructor(
    @Inject(S3Service) private s3Service: S3Service,
    @Inject(PG_CONNECTION) private db: DbPool,
    private readonly roleService: RoleService,
  ) {
    const stmConfigFile = './config/redacted_redacted.yaml';
    this.stm = new StateTransitionMachine(stmConfigFile);
    this.nftLock = new Lock<number>();
    fs.watch(stmConfigFile, (event, filename) => {
      if (event !== 'change') {
        return;
      }
      try {
        Logger.log('State transition machine config changed, reloading..');
        this.stm = new StateTransitionMachine(stmConfigFile);
        Logger.log('State transition machine config reloaded');
      } catch (err: any) {
        Logger.warn(
          `State transition machine config reload failed, err: ${err}`,
        );
      }
    });
  }

  async create(creator: User) {
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
      return { id: qryRes.rows[0].id };
    } catch (err: any) {
      Logger.error(`Unable to create new nft, err: ${err}`);
      throw new HttpException(
        'Unable to create new nft',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /*
  async findAll({ range, sort, filter }: QueryParams) {
    const { query: whereClause, params } = prepareFilterClause(filter);
    const limitClause =
      range.length === 2
        ? `LIMIT ${range[1] - range[0]} OFFSET ${range[0]}`
        : undefined;
    const sortField = sort && sort[0] ? convertToSnakeCase(sort[0]) : 'id';
    const sortDirection = sort && sort[1] ? sort[1] : 'ASC';
    const countResult = await this.db.query(
      getSelectCountStatement(whereClause, sortField),
      params,
    );
    const result = await this.db.query<Nft>(
      getSelectStatement(whereClause, sortField, sortDirection, limitClause),
      params,
    );
    return {
      data: result.rows.map((nft: Nft) => new NftDto(nft)),
      count: countResult.rowCount ?? 0,
    };
  }
*/

  async findOne(id: number): Promise<NftEntity | undefined> {
    const qryRes = await this.db.query(
      `
SELECT
  nft.id AS nft_id,
  nft.created_by,
  nft.created_at,
  nft.updated_at,
  nft.state,
  COALESCE(
    (
      SELECT
        ARRAY_AGG(ARRAY[name, value]) AS attributes
      FROM nft_attribute
      WHERE nft_id = $1
    ), ARRAY[]::TEXT[][]
  ) AS attributes
FROM nft
WHERE id = $1
    `,
      [id],
    );
    if (qryRes.rowCount === 0) {
      return undefined;
    }
    const row = qryRes.rows[0];

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
  }

  async getNft(user: User, nftId: number) {
    const roles = await this.roleService.getLabels(user.roles);
    const actor = new Actor(user.id, roles);

    const nft = await this.findOne(nftId);
    if (typeof nft === 'undefined') {
      throw new HttpException(`nft does not exist`, HttpStatus.BAD_REQUEST);
    }

    return {
      ...nft,
      allowedActions: this.stm.getAllowedActions(actor, nft),
    };
  }

  async apply(
    user: User,
    nftId: number,
    attr: string,
    value?: string,
  ): Promise<NftEntity> {
    await this.nftLock.acquire(nftId);
    try {
      const roles = await this.roleService.getLabels(user.roles);
      const actor = new Actor(user.id, roles);
      const nft = await this.findOne(nftId);
      if (typeof nft === 'undefined') {
        throw new HttpException(`nft does not exist`, HttpStatus.BAD_REQUEST);
      }

      const stmRes = this.stm.tryAttributeApply(actor, nft, attr, value);
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

      await this.update(user, nft);
      return this.getNft(user, nft.id);
    } catch (err: any) {
      throw err;
    } finally {
      this.nftLock.release(nftId);
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
