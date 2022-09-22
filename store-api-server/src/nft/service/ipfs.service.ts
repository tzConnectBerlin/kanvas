/* eslint-disable  @typescript-eslint/no-non-null-assertion */
import { Logger, Injectable, Inject } from '@nestjs/common';
import {
  PG_CONNECTION,
  STORE_PUBLISHERS,
  MINTER_ADDRESS,
  IPFS_PIN_PROVIDER,
} from '../../constants.js';
import { NftEntity } from '../../nft/entity/nft.entity.js';
import { isBottom } from '../../utils.js';
import { PinataService } from '../../ipfs_pin.module.js';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const mime = require('mime');

@Injectable()
export class NftIpfsService {
  constructor(
    @Inject(PG_CONNECTION) private conn: any,
    @Inject(IPFS_PIN_PROVIDER) private uploader: PinataService,
  ) {}

  async uploadNft(
    nft: NftEntity,
    dbTx: any = this.conn,
  ): Promise<string | undefined> {
    if (!this.uploader.enabled()) {
      Logger.warn(`Ipfs service not enabled`);
      return undefined;
    }

    const qryRes = await dbTx.query(
      `
SELECT metadata_ipfs, signature
FROM nft
WHERE id = $1
    `,
      [nft.id],
    );
    if (qryRes.rows[0]['metadata_ipfs'] != null) {
      return qryRes.rows[0]['metadata_ipfs'];
    }

    const metadata = await this.nftMetadataJson(
      nft,
      qryRes.rows[0]['signature'],
    );
    const metadataIpfs = await this.uploader.pinJson(metadata);

    await this.#updateNftIpfsHashes(
      nft.id,
      metadataIpfs,
      metadata.artifactUri,
      metadata.displayUri,
      metadata.thumbnailUri,
      dbTx,
    );
    return metadataIpfs;
  }

  async #updateNftIpfsHashes(
    nftId: number,
    metadataIpfs: string,
    artifactIpfs: string,
    displayIpfs?: string,
    thumbnailIpfs?: string,
    dbTx: any = this.conn,
  ) {
    await dbTx.query(
      `
UPDATE nft
SET metadata_ipfs = $2,
    artifact_ipfs = $3,
    display_ipfs = $4,
    thumbnail_ipfs = $5
WHERE id = $1
      `,
      [nftId, metadataIpfs, artifactIpfs, displayIpfs, thumbnailIpfs],
    );
  }

  async nftMetadataJson(nft: NftEntity, signature: string): Promise<any> {
    const createdAt = new Date(nft.createdAt * 1000).toISOString();

    let [artifactIpfs, displayIpfs, thumbnailIpfs] = [
      await this.uploader.pinUri(nft.artifactUri),
      await (!isBottom(nft.displayUri) && nft.displayUri !== nft.artifactUri
        ? this.uploader.pinUri(nft.displayUri!)
        : undefined),
      await (!isBottom(nft.thumbnailUri) && nft.thumbnailUri !== nft.displayUri
        ? this.uploader.pinUri(nft.thumbnailUri!)
        : undefined),
    ];

    const formats: { uri: string; mimeType: string }[] = [
      [artifactIpfs, nft.artifactUri],
      [displayIpfs, nft.displayUri],
      [thumbnailIpfs, nft.thumbnailUri],
    ]
      .reduce(
        (xs: string[][], [ipfsUri, origAssetUri]: (string | undefined)[]) => {
          if (
            typeof ipfsUri === 'undefined' ||
            typeof origAssetUri === 'undefined' ||
            typeof xs.find((x) => x[0] === ipfsUri) !== 'undefined'
          ) {
            return xs;
          }
          return [...xs, [ipfsUri, origAssetUri]];
        },
        [],
      )
      .flatMap(([ipfsUri, origAssetUri]) => {
        const format = this.#specifyIpfsUriFormat(ipfsUri, origAssetUri);
        if (typeof format === 'undefined') {
          return [];
        }
        return [format];
      });

    displayIpfs = displayIpfs ?? artifactIpfs;
    thumbnailIpfs = thumbnailIpfs ?? displayIpfs;
    return {
      decimals: 0,

      name: nft.name,
      description: nft.description,
      date: createdAt,
      tags: nft.categories.map((cat) => cat.name),

      artifactUri: artifactIpfs,
      displayUri: displayIpfs,
      thumbnailUri: thumbnailIpfs,
      formats,

      minter: MINTER_ADDRESS,
      creators: [], // TODO
      contributors: [], // TODO
      publishers: STORE_PUBLISHERS,

      isBooleanAmount: nft.editionsSize === 1,
      signature: signature,
    };
  }

  #specifyIpfsUriFormat(
    ipfsUri: string,
    origAssetUri: string,
  ): { uri: string; mimeType: string } | undefined {
    const mimeType = mime.getType(origAssetUri);
    if (isBottom(mimeType)) {
      Logger.warn(
        `failed to determine content type from asset uri, ipfsUri=${ipfsUri}, origAssetUri=${origAssetUri}`,
      );
      return undefined;
    }
    return {
      uri: ipfsUri,
      mimeType,
    };
  }
}
