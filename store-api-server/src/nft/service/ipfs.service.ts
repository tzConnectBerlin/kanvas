/* eslint-disable  @typescript-eslint/no-non-null-assertion */
import { Logger, Injectable, Inject } from '@nestjs/common';
import {
  PG_CONNECTION,
  STORE_PUBLISHERS,
  MINTER_ADDRESS,
  IPFS_PIN_PROVIDER,
  IPFS_RIGHTS_URI,
  IPFS_RIGHTS_MIMETYPE,
  DEFAULT_ROYALTIES_MINTER_SHARE,
  ROYALTIES_RECEIVER,
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

interface Attribute {
  name: string;
  value: string;
  type?: string;
}

interface NftMetadata {
  id: number;
  name: string;
  description: string;
  date: string;
  tags: string[];

  decimals: number;
  isBooleanAmount: boolean;

  artifactUri: string;
  displayUri: string;
  thumbnailUri: string;
  rightsUri?: string;
  // also setting rightUrl, this is a typo in the TZ-21 spec, but best to
  // support the intended name format (rightsUrl) as well as the typod
  // format (rightUrl)
  rightUri?: string;
  formats: IpfsFormat[];

  attributes?: Attribute[];

  minter: string;
  creators: string[];
  contributors: string[];
  publishers: string[];

  royalties: Royalties;

  signature: string;
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
SELECT metadata_ipfs, signature, artifact_ipfs, display_ipfs, thumbnail_ipfs
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
      qryRes.rows[0]['artifact_ipfs'],
      qryRes.rows[0]['display_ipfs'],
      qryRes.rows[0]['thumbnail_ipfs'],
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

  async nftMetadataJson(
    nft: NftEntity,
    signature: string,
    artifactIpfs: string | null,
    displayIpfs: string | null,
    thumbnailIpfs: string | null,
  ): Promise<NftMetadata> {
    const createdAt = new Date(nft.createdAt * 1000).toISOString();

    [artifactIpfs, displayIpfs, thumbnailIpfs] = [
      artifactIpfs ?? (await this.uploader.pinUri(nft.artifactUri)),
      displayIpfs ??
        (await (!isBottom(nft.displayUri) && nft.displayUri !== nft.artifactUri
          ? this.uploader.pinUri(nft.displayUri!)
          : undefined)),
      thumbnailIpfs ??
        (await (!isBottom(nft.thumbnailUri) &&
        nft.thumbnailUri !== nft.displayUri
          ? this.uploader.pinUri(nft.thumbnailUri!)
          : undefined)),
    ];

    const royalties = this.#defaultRoyalties();

    displayIpfs = displayIpfs ?? artifactIpfs;
    thumbnailIpfs = thumbnailIpfs ?? displayIpfs;
    const res: NftMetadata = {
      id: nft.id,
      decimals: 0,

      name: nft.name,
      description: nft.description,
      date: createdAt,
      tags: nft.categories.map((cat) => cat.name),

      artifactUri: artifactIpfs!,
      displayUri: displayIpfs!,
      thumbnailUri: thumbnailIpfs!,
      formats: Object.keys(nft.formats ?? []).reduce(
        (res: IpfsFormat[], k: string) => {
          let uri: string | undefined;
          switch (k) {
            case 'artifact':
              uri = artifactIpfs!;
              break;
            case 'display':
              uri = displayIpfs!;
              break;
            case 'thumbnail':
              uri = thumbnailIpfs!;
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

    if (typeof nft.metadata?.attributes !== 'undefined') {
      res.attributes = nft.metadata.attributes.flatMap(
        (attr: any): Attribute[] => {
          if (
            typeof attr.name === 'undefined' ||
            typeof attr.value === 'undefined'
          ) {
            return [];
          }
          const attrRes: Attribute = {
            name: attr.name,
            value: attr.value,
          };
          if (typeof attr.type !== 'undefined') {
            attrRes.type = attr.type;
          }
          return [attrRes];
        },
      );
    }

    if (typeof IPFS_RIGHTS_URI !== 'undefined') {
      res.rightsUri = IPFS_RIGHTS_URI;
      res.rightUri = IPFS_RIGHTS_URI;
      if (typeof IPFS_RIGHTS_MIMETYPE !== 'undefined') {
        res.formats.push({
          uri: IPFS_RIGHTS_URI,
          mimeType: IPFS_RIGHTS_MIMETYPE,
        });
      }
    }

    return res;
  }

  #defaultRoyalties(): Royalties {
    const royalties: Royalties = {
      decimals: 4,
      shares: {},
    };
    royalties.shares[`${ROYALTIES_RECEIVER}`] = DEFAULT_ROYALTIES_MINTER_SHARE;
    return royalties;
  }
}
