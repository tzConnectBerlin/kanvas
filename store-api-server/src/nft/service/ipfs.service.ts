import { Logger, Injectable } from '@nestjs/common';
import { STORE_PUBLISHERS, MINTER_ADDRESS } from 'src/constants';
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

  async uploadNft(nft: NftEntity): Promise<string> {
    if (!this.#serviceEnabled()) {
      throw `IpfsService not enabled`;
    }

    const [artifactIpfsUri, displayIpfsUri, thumbnailIpfsUri] =
      await Promise.all([
        this.#pinUri(nft.artifactUri),
        nft.displayUri ? this.#pinUri(nft.displayUri) : undefined,
        nft.thumbnailUri ? this.#pinUri(nft.thumbnailUri) : undefined,
      ]);

    const metadata = this.#nftMetadataJson(
      nft,
      artifactIpfsUri,
      displayIpfsUri ?? artifactIpfsUri,
      thumbnailIpfsUri ?? displayIpfsUri ?? artifactIpfsUri,
    );
    return await this.#pinJson(metadata);
  }

  #nftMetadataJson(
    nft: NftEntity,
    artifactIpfsUri: string,
    displayIpfsUri: string,
    thumbnailIpfsUri: string,
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
