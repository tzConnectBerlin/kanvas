import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { NFT_IMAGE_PREFIX, PG_CONNECTION } from 'src/constants';
import { DbPool } from 'src/db.module';
import { QueryParams } from 'src/types';
import { User } from 'src/user/entities/user.entity';
import { convertToSnakeCase, prepareFilterClause } from 'src/utils';
import { NftDto } from './dto/nft.dto';
import { Nft } from './entities/nft.entity';
import { S3Service } from './s3.service';

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
  constructor(
    @Inject(S3Service) private s3Service: S3Service,
    @Inject(PG_CONNECTION) private db: DbPool,
  ) {}

  async create(creator: User, createNftDto: NftDto, picture: any) {
    try {
      const metadata = createNftDto.metadata ?? {};
      const dataUri = await this.s3Service.uploadFile(
        picture,
        `${NFT_IMAGE_PREFIX}${createNftDto.nftName}`,
      );
      const nftEntity = new Nft({
        ...createNftDto,
        createdBy: creator.id,
        dataUri,
        metadata,
      });
      const params = nftEntity.filterDefinedValues();
      const query = getInsertStatement(nftEntity);
      const result = await this.db.query(query, params);
      return { id: result.rows[0].id, ...createNftDto };
    } catch (error) {
      console.log('Unable to create new nft', error);
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

  async findOne(id: number) {
    const result = await this.db.query<Nft>(
      getSelectStatement('WHERE id = $1'),
      [id],
    );
    return new NftDto(result.rows[0]);
  }

  async update(id: number, updateNftDto: NftDto, picture: any) {
    let dataUri;
    if (picture) {
      dataUri = await this.s3Service.uploadFile(
        picture,
        `${NFT_IMAGE_PREFIX}${updateNftDto.nftName}`,
      );
    }
    const nft = new Nft({ ...updateNftDto, dataUri });
    const query = getUpdateStatement(nft);
    const params = nft.filterDefinedValues();
    const result = await this.db.query(query, [...params, id]);
    if (result.rowCount >= 1) {
      return this.findOne(id);
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
