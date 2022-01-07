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
import { Nft } from './entities/nft.entity';
import { NftDto } from './dto/nft.dto';
import { RoleService } from 'src/role/role.service';
import { S3Service } from './s3.service';
import { QueryParams } from 'src/types';
import { convertToSnakeCase, prepareFilterClause } from 'src/utils';
import { Lock } from 'async-await-mutex-lock';

const getSelectStatement = (
  whereClause = '',
  sortField = 'id',
  sortDirection = 'ASC',
  limitClause = '',
): string =>
  `SELECT * FROM nft ${whereClause} ORDER BY ${sortField} ${sortDirection} ${limitClause}`;

const getSelectCountStatement = (
  whereClause = '',
  sortField = 'id',
  sortDirection = 'ASC',
): string =>
  `SELECT COUNT(*) FROM nft ${whereClause} GROUP BY nft.id ORDER BY ${sortField} ${sortDirection}`;

const DELETE_NFT_QUERY = 'UPDATE nft SET disabled = true WHERE id = $1';

const getInsertStatement = (nft: Nft) => {
  const keys = nft.getFieldsWithValues();
  return `INSERT INTO nft (${keys.join(',')}) VALUES (${keys
    .map((key, index) => `$${index + 1}`)
    .join(',')}) RETURNING id;`;
};

const getUpdateStatement = (nft: Nft) => {
  const keys = nft.getFieldsWithValues();
  return `UPDATE nft set (${keys.join(',')}) = (${keys
    .map((key, index) => `$${index + 1}`)
    .join(',')}) WHERE id = $${keys.length + 1};`;
};

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

  async create(creator: User, createNftDto: NftDto, picture: any) {
    try {
      const metadata = createNftDto.metadata ?? {};
      //const dataUri = await this.s3Service.uploadFile(
      //  picture,
      //  `${NFT_IMAGE_PREFIX}${createNftDto.nftName}`,
      //);
      const nftEntity = new Nft({
        ...createNftDto,
        createdBy: creator.id,
        dataUri: 'todo', // dataUri,
        metadata,
      });
      const params = nftEntity.filterDefinedValues();
      const query = getInsertStatement(nftEntity);
      const result = await this.db.query(query, params);
      return { id: result.rows[0].id, ...createNftDto };
    } catch (err: any) {
      Logger.error(`Unable to create new nft, err: ${err}`);
      throw new HttpException(
        'Unable to create new nft',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

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

  async findOne(id: number): Promise<NftDto | undefined> {
    const result = await this.db.query<Nft>(
      getSelectStatement('WHERE id = $1'),
      [id],
    );
    console.log(result);
    console.log(result.rows[0].categories);
    if (result.rowCount === 0) {
      return undefined;
    }
    return new NftDto(result.rows[0]);
  }

  async getNft(user: User, nftId: number) {
    const roles = await this.roleService.getLabels(user.roles);
    const actor = new Actor(user.id, roles);
    const nft = await this.findOne(nftId);
    if (typeof nft === 'undefined') {
      throw new HttpException(`nft does not exist`, HttpStatus.BAD_REQUEST);
    }

    const nft_state = {
      id: nft.id,
      state: nft.nftState,
      attributes: {
        ...nft,
      },
    };
    delete nft_state.attributes.id;
    delete nft_state.attributes.nftState;

    return {
      ...nft,
      allowedActions: this.stm.getAllowedActions(actor, nft_state),
    };
  }

  async apply(
    user: User,
    nftId: number,
    attr: string,
    value?: string,
  ): Promise<NftDto> {
    await this.nftLock.acquire(nftId);
    try {
      const roles = await this.roleService.getLabels(user.roles);
      const actor = new Actor(user.id, roles);
      const nft = await this.findOne(nftId);
      if (typeof nft === 'undefined') {
        throw new HttpException(`nft does not exist`, HttpStatus.BAD_REQUEST);
      }

      const nft_state = {
        id: nft.id,
        state: nft.nftState,
        attributes: {
          ...nft,
        },
      };
      delete nft_state.attributes.id;
      delete nft_state.attributes.nftState;

      const stmRes = this.stm.tryAttributeApply(actor, nft_state, attr, value);
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
      console.log(nft_state);
      const updatedNft = {
        ...nft_state.attributes,
        id: nft_state.id,
        nftState: nft_state.state,
      };

      return await this.update(updatedNft);
    } catch (err: any) {
      throw err;
    } finally {
      this.nftLock.release(nftId);
    }
  }

  async update(updateNftDto: NftDto): Promise<NftDto> {
    const nft = new Nft({ ...updateNftDto });
    const query = getUpdateStatement(nft);
    const params = nft.filterDefinedValues();
    const result = await this.db.query(query, [...params, nft.id]);
    if (result.rowCount >= 1) {
      return this.findOne(nft.id);
    }
    throw new HttpException('Unable to update nft', HttpStatus.BAD_REQUEST);
  }

  async remove(id: number) {
    const result = await this.db.query(DELETE_NFT_QUERY, [id]);
    if (result.rowCount === 1) {
      return this.findOne(id);
    }
    throw Error('Unable to disable/delete nft');
  }
}
