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
import { NftEntity, NftAttribute } from './entities/nft.entity';
import { RoleService } from 'src/role/role.service';
import { S3Service } from './s3.service';
import { QueryParams } from 'src/types';
import { Lock } from 'async-await-mutex-lock';

@Injectable()
export class NftService {
  stm: StateTransitionMachine;
  nftLock: Lock<number>;

  constructor(
    @Inject(S3Service) private s3Service: S3Service,
    @Inject(PG_CONNECTION) private db: DbPool,
    private readonly roleService: RoleService,
  ) {
    this.stm = new StateTransitionMachine('./config/redacted_redacted.yaml');
    this.nftLock = new Lock<number>();
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
  COALESCE((
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
    console.log(qryRes);
    const row = qryRes.rows[0];
    return <NftEntity>{
      id: row['nft_id'],
      createdBy: row['created_by'],
      createdAt: Math.floor(row['created_at'].getTime() / 1000),
      updatedAt: Math.floor(row['updated_at'].getTime() / 1000),
      state: row['state'],
      attributes: row['attributes'].map(
        (attrRow: any) =>
          <NftAttribute>{
            name: attrRow['name'],
            value: attrRow['value'],
          },
      ),
    };
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
      console.log(nft);

      await this.update(nft);
      return this.findOne(nft.id);
    } catch (err: any) {
      throw err;
    } finally {
      this.nftLock.release(nftId);
    }
  }

  async update(nft: NftEntity) {
    console.log(`updating nft: ${JSON.stringify(nft)}`);
    const dbTx = await this.db.connect();
    try {
      await dbTx.query(`BEGIN`);
      dbTx.query(
        `
DELETE FROM nft_attribute
WHERE nft_id = $1
      `,
        [nft.id],
      );

      await dbTx.query(
        `
INSERT INTO nft_attribute (
  nft_id, name, value
)
SELECT $1, attr.name, attr.value
FROM UNNEST($2) attr(name, value)
      `,
        [
          nft.id,
          nft.attributes.map((k: any) => {
            k.name, k.value;
          }),
        ],
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
