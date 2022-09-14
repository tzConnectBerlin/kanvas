/* eslint-disable  @typescript-eslint/no-non-null-assertion */
import { Logger, Injectable, Inject } from '@nestjs/common';
import {
  PG_CONNECTION,
  STORE_PUBLISHERS,
  MINTER_ADDRESS,
} from '../../constants.js';
import { NftEntity } from '../../nft/entity/nft.entity.js';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import { createReadStream, createWriteStream } from 'fs';
import FormData from 'form-data';
import * as tmp from 'tmp';
import { isBottom } from '../../utils.js';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const mime = require('mime');

axiosRetry(axios, {
  retries: 3,
});

async function downloadFile(uri: string, targetFile: string) {
  const writer = createWriteStream(targetFile);

  const response = await axios.get(uri, {
    responseType: 'stream',
  });
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

@Injectable()
export class IpfsService {
  PINATA_API_KEY = process.env['PINATA_API_KEY'];
  PINATA_API_SECRET = process.env['PINATA_API_SECRET'];

  constructor(@Inject(PG_CONNECTION) private conn: any) {}

  async uploadNft(
    nft: NftEntity,
    dbTx: any = this.conn,
  ): Promise<string | undefined> {
    if (!this.#serviceEnabled()) {
      Logger.warn(`IpfsService not enabled`);
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

    const metadata = await this.#nftMetadataJson(
      nft,
      qryRes.rows[0]['signature'],
    );
    const metadataIpfs = await this.#pinJson(metadata);

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

  async #nftMetadataJson(nft: NftEntity, signature: string): Promise<any> {
    const createdAt = new Date(nft.createdAt * 1000).toISOString();

    let [artifactIpfs, displayIpfs, thumbnailIpfs] = [
      await this.#pinUri(nft.artifactUri),
      await (nft.displayUri !== nft.artifactUri
        ? this.#pinUri(nft.displayUri!)
        : undefined),
      await (nft.thumbnailUri !== nft.displayUri
        ? this.#pinUri(nft.thumbnailUri!)
        : undefined),
    ];
    displayIpfs = displayIpfs ?? artifactIpfs;
    thumbnailIpfs = thumbnailIpfs ?? displayIpfs ?? artifactIpfs;

    const formats: { uri: string; mimeType: string }[] = [
      [artifactIpfs, nft.artifactUri],
      [displayIpfs, nft.displayUri],
      [thumbnailIpfs, nft.thumbnailUri],
    ].flatMap(([ipfsUri, origAssetUri]) => {
      const format = this.#specifyIpfsUriFormat(artifactIpfs, nft.artifactUri);
      if (typeof format === 'undefined') {
        return [];
      }
      return [format];
    });

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

  async #pinUri(uri: string): Promise<string> {
    const tmpFile = tmp.fileSync();
    const tmpFileName = tmpFile.name;

    await downloadFile(uri, tmpFileName);

    const form = new FormData();
    form.append('file', createReadStream(tmpFileName));

    return axios
      .post('https://api.pinata.cloud/pinning/pinFileToIPFS', form, {
        maxBodyLength: 1000000000, //this is needed to prevent axios from erroring with large files
        headers: {
          pinata_api_key: this.PINATA_API_KEY || '',
          pinata_secret_api_key: this.PINATA_API_SECRET || '',
          ...form.getHeaders(),
        },
      })
      .then(function (response: any) {
        tmpFile.removeCallback();
        return 'ipfs://' + response.data.IpfsHash;
      })
      .catch(function (error: any) {
        Logger.error(
          `failed to pin content from uri (downloaded to file: ${tmpFileName})to ipfs, err: ${error}`,
        );
        tmpFile.removeCallback();
        throw error;
      });
  }

  async #pinJson(jsonData: string): Promise<string> {
    return axios
      .post('https://api.pinata.cloud/pinning/pinJSONToIPFS', jsonData, {
        headers: {
          pinata_api_key: this.PINATA_API_KEY || '',
          pinata_secret_api_key: this.PINATA_API_SECRET || '',
        },
      })
      .then(function (response: any) {
        return 'ipfs://' + response.data.IpfsHash;
      })
      .catch(function (error: any) {
        Logger.error(
          `failed to pin JSON to IPFS (JSON=${jsonData}), err: ${error}`,
        );
        throw error;
      });
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

  #serviceEnabled(): boolean {
    if (typeof this.PINATA_API_KEY === 'undefined') {
      Logger.warn(
        `failed to upload NFT to IPFS, IpfsService not enabled: PINATA_API_KEY env var not set`,
      );
      return false;
    }
    if (typeof this.PINATA_API_SECRET === 'undefined') {
      Logger.warn(
        `failed to upload NFT to IPFS, IpfsService not enabled: PINATA_API_SECRET env var not set`,
      );
      return false;
    }
    return true;
  }
}
