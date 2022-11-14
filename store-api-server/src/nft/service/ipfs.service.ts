/* eslint-disable  @typescript-eslint/no-non-null-assertion */
import { Logger, Injectable, Inject } from '@nestjs/common';
import {
  PG_CONNECTION,
  STORE_PUBLISHERS,
  MINTER_ADDRESS,
  IPFS_PIN_PROVIDER,
  DEFAULT_ROYALTIES_MINTER_SHARE,
} from '../../constants.js';
import { NftEntity } from '../../nft/entity/nft.entity.js';
import { isBottom } from '../../utils.js';

interface Royalties {
  decimals: number;
  shares: { [key: string]: number };
}
interface IpfsFormat {
  [key: string]: any;
  uri: string;
}

@Injectable()
export class NftIpfsService {
  constructor(
    @Inject(PG_CONNECTION) private conn: any,
    @Inject(IPFS_PIN_PROVIDER) private uploader: any,
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

    const royalties = this.#defaultRoyalties();

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
      formats: Object.keys(nft.formats ?? []).reduce(
        (res: IpfsFormat[], k: string) => {
          let uri: string | undefined;
          switch (k) {
            case 'artifact':
              uri = artifactIpfs;
              break;
            case 'display':
              uri = displayIpfs;
              break;
            case 'thumbnail':
              uri = thumbnailIpfs;
              break;
          }
          if (
            typeof uri === 'undefined' ||
            res.map((format) => format.uri).includes(uri)
          ) {
            return res;
          }
          res.push({
            uri,
            ...nft.formats![k],
          });
          return res;
        },
        [],
      ),
      minter: MINTER_ADDRESS,
      creators: [MINTER_ADDRESS],
      contributors: [], // TODO
      publishers: STORE_PUBLISHERS,

      isBooleanAmount: nft.editionsSize === 1,
      signature: signature,

      royalties,
    };
  }

  #defaultRoyalties(): Royalties {
    const royalties: Royalties = {
      decimals: 2,
      shares: {},
    };
    royalties.shares[`${MINTER_ADDRESS}`] = DEFAULT_ROYALTIES_MINTER_SHARE;
    return royalties;
  }
}
