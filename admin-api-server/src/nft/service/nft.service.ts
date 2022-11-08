import {
  Logger,
  HttpException,
  HttpStatus,
  Injectable,
  Inject,
} from '@nestjs/common';
import {
  PG_CONNECTION,
  FILE_PREFIX,
  STM_CONFIG_FILE,
  NFT_PUBLISH_STATE,
  NFT_DELIST_STATE,
  STORE_API,
  ADMIN_PRIVATE_KEY,
} from '../../constants.js';
import {
  SIGNATURE_PREFIX_CREATE_NFT,
  SIGNATURE_PREFIX_DELIST_NFT,
  SIGNATURE_PREFIX_RELIST_NFT,
} from 'kanvas-api-lib';
import { DbPool } from '../../db.module.js';
import {
  STMResultStatus,
  StateTransitionMachine,
  Actor,
  ContentRestrictions,
} from 'kanvas-stm-lib';
import { UserEntity } from '../../user/entities/user.entity.js';
import { NftEntity, NftUpdate } from '../entities/nft.entity.js';
import { NftFilterParams, NftFilters } from '../params.js';
import { RoleService } from '../../role/service/role.service.js';
import { S3Service } from './s3.service.js';
import { CategoryService } from '../../category/service/category.service.js';
import { CategoryEntity } from '../../category/entity/category.entity.js';
import { Lock } from 'async-await-mutex-lock';
import sotez from 'sotez';
const { cryptoUtils } = sotez;
import axios from 'axios';
import { watch, FSWatcher } from 'fs';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const mime = require('mime');

import { getContentMetadata } from '../../media.js';

@Injectable()
export class NftService {
  stmFileWatcher: FSWatcher;
  stm: StateTransitionMachine;
  nftLock: Lock<number>;
  CONTENT_TYPE = 'content_uri';
  TOP_LEVEL_IDENTIFIERS = ['id', 'state', 'created_at', 'updated_at'];
  DELETABLE_IN_STATES = ['creation', 'setup_nft'];

  constructor(
    @Inject(S3Service) private s3Service: S3Service,
    @Inject(PG_CONNECTION) private db: DbPool,
    @Inject(CategoryService) private categoryService: CategoryService,
    private readonly roleService: RoleService,
  ) {
    const stmConfigFile = STM_CONFIG_FILE;
    try {
      this.stm = new StateTransitionMachine(stmConfigFile);
    } catch (err: any) {
      Logger.error(
        `State transition machine config load failed, shutting down. err: ${err}`,
      );
      process.exit(1);
    }
    this.nftLock = new Lock<number>();

    this.stmFileWatcher = watch(
      stmConfigFile,
      (event: any /* , filename: any */) => {
        if (event !== 'change' && event !== 'rename') {
          Logger.log(`ignored stm config file event: ${event}`);
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
      },
    );
  }

  beforeApplicationShutdown() {
    this.stmFileWatcher.close();
  }

  getAttributes(): any {
    return this.stm.getAttributes();
  }

  getContentRestrictions(contentAttr: string): ContentRestrictions | undefined {
    return this.stm.getContentRestrictions(contentAttr);
  }

  getSortableFields(): string[] {
    return [
      ...this.TOP_LEVEL_IDENTIFIERS,
      ...Object.keys(this.getAttributes()),
    ];
  }

  async findAll(
    params: NftFilterParams,
  ): Promise<{ count: number; data: NftEntity[] }> {
    let orderBy = params.orderBy;
    if (
      Object.keys(this.stm.getAttributes()).some(
        (ident: string) => ident === orderBy,
      )
    ) {
      orderBy = `naturalsort(attributes->>'${orderBy}')`;
    }

    const qryRes = await this.db.query(
      `
WITH attr AS (
  SELECT
    nft_id,
    JSONB_OBJECT(ARRAY_AGG(name), ARRAY_AGG(value)) AS attributes,
    MAX(set_at) AS last_updated_at
  FROM nft_attribute
  WHERE ($2::INTEGER[] IS NULL OR nft_id = ANY($2::INTEGER[]))
  GROUP BY nft_id
)
SELECT
  nft.id,
  nft.state,
  nft.created_by,
  nft.created_at,
  COALESCE(attr.last_updated_at, nft.created_at) AS updated_at,
  attr.attributes,
  COUNT(1) OVER () AS total_matched_nfts
FROM nft
LEFT JOIN attr
  ON nft.id = attr.nft_id
WHERE ($1::TEXT[] IS NULL OR state = ANY($1::TEXT[]))
  AND ($2::INTEGER[] IS NULL OR id = ANY($2::INTEGER[]))
ORDER BY ${orderBy} ${params.orderDirection} ${orderBy !== 'id' ? ', id' : ''}
OFFSET ${params.pageOffset}
LIMIT  ${params.pageSize}
      `,
      [params.filters?.nftStates, params.filters?.nftIds],
    );

    if (qryRes.rowCount === 0) {
      return { data: [], count: 0 };
    }

    return {
      data: qryRes.rows.map((row: any) => {
        const nft = <NftEntity>{
          id: row['id'],
          state: row['state'],
          createdBy: row['created_by'],
          createdAt: Math.floor(row['created_at'].getTime() / 1000),
          updatedAt: Math.floor(row['updated_at'].getTime() / 1000),
          attributes: {},
        };
        for (const key of Object.keys(row['attributes'] || [])) {
          nft.attributes[key] = JSON.parse(row['attributes'][key]);
        }
        return nft;
      }),
      count: Number(qryRes.rows[0]['total_matched_nfts']),
    };
  }

  async #findByIds(nftIds: number[]): Promise<NftEntity[]> {
    const filterParams = new NftFilterParams();
    filterParams.filters = new NftFilters();

    filterParams.filters.nftIds = nftIds;
    filterParams.pageSize = nftIds.length;
    return (await this.findAll(filterParams)).data;
  }

  async #findOne(nftId: number): Promise<NftEntity> {
    const nfts = await this.#findByIds([nftId]);

    if (nfts.length === 0) {
      throw new HttpException(`nft does not exist`, HttpStatus.BAD_REQUEST);
    }
    return nfts[0];
  }

  async getNft(user: UserEntity, nftId: number) {
    const nft = await this.#findOne(nftId);
    const actor = await this.#getActorForNft(user, nft);

    return {
      ...nft,
      allowedActions: this.stm.getAllowedActions(actor, nft),
      stateInfo: this.stm.tryMoveNft(nft),
    };
  }

  async createNft(creator: UserEntity): Promise<NftEntity> {
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

      const test = await this.getNft(creator, qryRes.rows[0].id);

      return test;
    } catch (err: any) {
      Logger.error(`Unable to create new nft, err: ${err}`);
      throw new HttpException(
        'Unable to create new nft',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async applyNftUpdates(
    user: UserEntity,
    nftId: number,
    nftUpdates: NftUpdate[],
  ): Promise<NftEntity> {
    return await this.withNftLock(nftId, async () => {
      const nfts = await this.#findByIds([nftId]);
      if (nfts.length === 0) {
        throw new HttpException(`nft does not exist`, HttpStatus.BAD_REQUEST);
      }
      const nft = nfts[0];
      const actor = await this.#getActorForNft(user, nft);

      for (let i = 0; i < nftUpdates.length; i++) {
        let nftUpdate = nftUpdates[i];

        // Check if attribute is of type content in order to upload to ipfs
        if (typeof nftUpdate.file !== 'undefined') {
          nftUpdate = await this.#uploadContent(
            user,
            nft.id,
            nftUpdate.attribute,
            nftUpdate.file,
          );
        }

        const stmRes = this.stm.tryAttributeApply(
          actor,
          nft,
          nftUpdate.attribute,
          nftUpdate.value,
        );

        if (i == nftUpdates.length - 1) {
          this.stm.tryMoveNft(nft);
        }

        if (stmRes.status != STMResultStatus.OK) {
          switch (stmRes.status) {
            case STMResultStatus.NOT_ALLOWED:
              throw new HttpException(
                stmRes.message || '',
                HttpStatus.FORBIDDEN,
              );
            default:
              throw new HttpException(
                stmRes.message || '',
                HttpStatus.INTERNAL_SERVER_ERROR,
              );
          }
        }
      }

      await this.#updateNft(user, nft);
      return await this.getNft(user, nft.id);
    });
  }

  async deleteNft(user: UserEntity, nftId: number) {
    return await this.withNftLock(nftId, async () => {
      const nft = await this.#findOne(nftId);
      const actor = await this.#getActorForNft(user, nft);
      if (
        !actor.roles.some(
          (userRole: string) => userRole === 'creator' || userRole === 'admin',
        )
      ) {
        throw new HttpException(
          'no permission to delete this nft (only the creator may)',
          HttpStatus.FORBIDDEN,
        );
      }
      if (
        !this.DELETABLE_IN_STATES.some((state: string) => nft.state === state)
      ) {
        throw new HttpException(
          'no permission to delete this nft (nft is not in a state where it may still be deleted)',
          HttpStatus.FORBIDDEN,
        );
      }

      await this.#deleteNft(nftId);
    });
  }

  async #deleteNft(nftId: number) {
    const dbTx = await this.db.connect();
    try {
      await dbTx.query(`BEGIN`);
      await dbTx.query(
        `
DELETE FROM nft_attribute
WHERE nft_id = $1
`,
        [nftId],
      );
      await dbTx.query(
        `
DELETE FROM nft
WHERE id = $1
`,
        [nftId],
      );
      await dbTx.query('COMMIT');
    } catch (err: any) {
      await dbTx.query('ROLLBACK');
      throw err;
    } finally {
      dbTx.release();
    }
  }

  async #uploadContent(
    user: UserEntity,
    nftId: number,
    attribute: string,
    file: any,
  ): Promise<NftUpdate> {
    // verify first that we are allowed to change the content, before uploading
    // to S3 (and potentially overwriting an earlier set content)
    const nft = await this.getNft(user, nftId);
    if (typeof nft === 'undefined') {
      throw new HttpException(`nft does not exist`, HttpStatus.BAD_REQUEST);
    }
    if (!nft.allowedActions.hasOwnProperty(attribute)) {
      throw new HttpException(
        `attribute '${attribute}' is not allowed to be set by you for nft with state '${nft.state}'`,
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (nft.allowedActions[attribute] != this.CONTENT_TYPE) {
      throw new HttpException(
        `attribute '${attribute}' is not of type ${this.CONTENT_TYPE}`,
        HttpStatus.UNAUTHORIZED,
      );
    }

    const extension = mime.getExtension(file.mimetype);
    const fileName = `${FILE_PREFIX}_${nftId}_${attribute}.${extension}`;
    const contentUri = await this.s3Service.uploadFile(file, fileName);

    return <NftUpdate>{
      attribute: attribute,
      value: JSON.stringify({
        uri: contentUri,
        metadata: await getContentMetadata(nftId, file),
      }),
    };
  }

  async #updateNft(setBy: UserEntity, nft: NftEntity) {
    const attrNames = Object.keys(nft.attributes);
    const attrValues = attrNames.map((name: string) =>
      JSON.stringify(nft.attributes[name]),
    );

    const dbTx = await this.db.connect();
    try {
      await dbTx.query(`BEGIN`);

      const oldStateQryRes = await dbTx.query(
        `
SELECT state
FROM nft
WHERE id = $1
      `,
        [nft.id],
      );
      dbTx.query(
        `
UPDATE nft
SET
  state = $2
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

      const oldState = oldStateQryRes.rows[0].state;
      if (nft.state !== oldState) {
        switch (nft.state) {
          case NFT_PUBLISH_STATE:
            if (oldState === NFT_DELIST_STATE) {
              await this.#relistNft(nft);
            } else {
              await this.#publishNft(nft);
            }
            break;
          case NFT_DELIST_STATE:
            await this.#delistNft(nft);
            break;
        }
      }

      await dbTx.query(`COMMIT`);
    } catch (err: any) {
      Logger.error(`failed to update nft (id=${nft.id}), err: ${err}`);
      await dbTx.query(`ROLLBACK`);
      throw err;
    } finally {
      dbTx.release();
    }
  }

  async #getActorForNft(user: UserEntity, nft: NftEntity): Promise<Actor> {
    const roles = await this.roleService.getLabels(user.roles);
    if (nft.createdBy === user.id) {
      roles.push('creator');
    }
    return new Actor(user.id, roles);
  }

  async #assertNftPublishable(nft: NftEntity) {
    if (nft.state !== NFT_PUBLISH_STATE) {
      throw `cannot publish nft that is not in the publish state (nft id=${nft.id}, nft state=${nft.state})`;
    }
    const attr = nft.attributes;

    const allowedCategories = await this.categoryService.getNftAssignable();
    if (
      attr.categories.some(
        (cat: number) =>
          !allowedCategories.some(
            (allowed: CategoryEntity) => cat === allowed.id,
          ),
      )
    ) {
      throw `some categories are not valid (assigned categories: ${JSON.stringify(
        attr.categories,
      )}, allowed categories: ${JSON.stringify(allowedCategories)} )`;
    }
  }

  async #publishNft(nft: NftEntity) {
    await this.#assertNftPublishable(nft);
    const attr = nft.attributes;

    const signed = await this.#signNftAction(
      SIGNATURE_PREFIX_CREATE_NFT,
      nft.id,
      ADMIN_PRIVATE_KEY,
    );

    const formats: { [key: string]: ContentMetadata } = {};
    if (typeof attr.artifact.metadata !== 'undefined') {
      formats['artifact'] = attr.artifact;
    }
    if (typeof attr.display?.metadata !== 'undefined') {
      formats['display'] = attr.display.metadata;
    }
    if (typeof attr.thumbnail?.metadata !== 'undefined') {
      formats['thumbnail'] = attr.thumbnail.metadata;
    }

    await axios.post(STORE_API + '/nfts/create', {
      id: nft.id,
      name: attr.name,
      description: attr.description,

      artifactUri: attr.artifact.uri,
      displayUri: attr.display?.uri,
      thumbnailUri: attr.thumbnail?.uri,
      formats,

      price: attr.price,
      categories: attr.categories,
      editionsSize: attr.edition_size,
      onsaleFrom: attr.onsale_from,
      onsaleUntil: attr.onsale_until,

      signature: signed,
    });

    Logger.log(`Published NFT ${nft.id} to the store database`);
  }

  async #delistNft(nft: NftEntity) {
    const signed = await this.#signNftAction(
      SIGNATURE_PREFIX_DELIST_NFT,
      nft.id,
      ADMIN_PRIVATE_KEY,
    );

    await axios.post(STORE_API + `/nfts/delist/${nft.id}`, {
      signature: signed,
    });

    Logger.log(`Delisted NFT ${nft.id} from the store`);
  }

  async #relistNft(nft: NftEntity) {
    const signed = await this.#signNftAction(
      SIGNATURE_PREFIX_RELIST_NFT,
      nft.id,
      ADMIN_PRIVATE_KEY,
    );

    await axios.post(STORE_API + `/nfts/relist/${nft.id}`, {
      signature: signed,
    });

    Logger.log(`Relisted NFT ${nft.id} in the store`);
  }

  async #signNftAction(
    hexPrefix: string,
    nftId: number,
    privateKey: string,
  ): Promise<string> {
    let nftIdHex = nftId.toString(16);
    if (nftIdHex.length & 1) {
      // hex is of uneven length, sotez expects an even number of hexadecimal characters
      nftIdHex = '0' + nftIdHex;
    }
    return (await cryptoUtils.sign(hexPrefix + nftIdHex, privateKey)).sig;
  }

  async withNftLock<ResTy>(
    nftId: number,
    f: () => Promise<ResTy>,
  ): Promise<ResTy> {
    await this.nftLock.acquire(nftId);
    try {
      return await f();
    } finally {
      this.nftLock.release(nftId);
    }
  }
}
