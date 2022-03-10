/* eslint-disable  @typescript-eslint/no-non-null-assertion */
import { Logger, Injectable, Inject } from '@nestjs/common';
import { PG_CONNECTION, STORE_PUBLISHERS, MINTER_ADDRESS } from 'src/constants';
import { NftEntity } from 'src/nft/entity/nft.entity';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import { createReadStream, createWriteStream } from 'fs';
import * as FormData from 'form-data';
import * as tmp from 'tmp';

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
SELECT ipfs_hash, signature
FROM nft
WHERE id = $1
    `,
      [nft.id],
    );
    if (qryRes['ipfs_hash'] != null) {
      return qryRes['ipfs_hash'];
    }

    const [artifactIpfsUri, displayIpfsUri, thumbnailIpfsUri] = [
      await this.#pinUri(nft.artifactUri),
      await (nft.displayUri !== nft.artifactUri
        ? this.#pinUri(nft.displayUri!)
        : undefined),
      await (nft.thumbnailUri !== nft.displayUri
        ? this.#pinUri(nft.thumbnailUri!)
        : undefined),
    ];

    const metadata = this.#nftMetadataJson(
      nft,
      artifactIpfsUri,
      displayIpfsUri ?? artifactIpfsUri,
      thumbnailIpfsUri ?? displayIpfsUri ?? artifactIpfsUri,
      qryRes['signature'],
    );
    const ipfsHash = await this.#pinJson(metadata);

    await this.#updateNftIpfsHash(nft.id, ipfsHash, dbTx);
    return ipfsHash;
  }

  async #updateNftIpfsHash(
    nftId: number,
    ipfsHash: string,
    dbTx: any = this.conn,
  ) {
    await dbTx.query(
      `
UPDATE nft
SET ipfs_hash = $1
WHERE id = $2
      `,
      [ipfsHash, nftId],
    );
  }

  #nftMetadataJson(
    nft: NftEntity,
    artifactIpfsUri: string,
    displayIpfsUri: string,
    thumbnailIpfsUri: string,
    signature: string,
  ): any {
    const createdAt = new Date(nft.createdAt).toISOString();

    return {
      decimals: 0,

      name: nft.name,
      description: nft.description,
      date: createdAt,
      tags: nft.categories.map((cat) => cat.name),

      artifactUri: artifactIpfsUri,
      displayUri: displayIpfsUri,
      thumbnailUri: thumbnailIpfsUri,

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
