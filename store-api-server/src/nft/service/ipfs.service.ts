import { Logger, Injectable, Inject } from '@nestjs/common';
import {
  IPFS_NODE,
  STORE_SYMBOL,
  STORE_PUBLISHERS,
  MINTER_ADDRESS,
} from 'src/constants';
import { NftEntity } from 'src/nft/entity/nft.entity';
import { create } from 'ipfs-http-client';
import axios from 'axios';
import { createReadStream, createWriteStream } from 'fs';
import * as FormData from 'form-data';
import * as tmp from 'tmp';
import { assertEnv } from 'src/utils';

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
  PINATA_API_KEY = assertEnv('PINATA_API_KEY');
  PINATA_API_SECRET = assertEnv('PINATA_API_SECRET');

  async uploadNft(nft: NftEntity): Promise<string> {
    const [displayIpfs, thumbnailIpfs] = await Promise.all([
      this.#pinUri(nft.dataUri),
      this.#pinUri(nft.dataUri), // TODO: insert thumbnailUri here instead
    ]);

    const metadata = this.#nftMetadataJson(nft, displayIpfs, thumbnailIpfs);
    return await this.#pinJson(metadata);
  }

  #nftMetadataJson(
    nft: NftEntity,
    imageUri: string,
    thumbnailUri: string,
  ): any {
    const createdAt = new Date(nft.createdAt).toISOString();

    return {
      symbol: STORE_SYMBOL,
      decimals: 0,

      name: nft.name,
      description: nft.description,
      date: createdAt,
      tags: nft.categories.map((cat) => cat.name),

      displayUrl: imageUri,
      thumbnailUri: thumbnailUri,

      minter: MINTER_ADDRESS,
      creators: [], // TODO
      contributors: [], // TODO
      publishers: STORE_PUBLISHERS,
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
          pinata_api_key: this.PINATA_API_KEY,
          pinata_secret_api_key: this.PINATA_API_SECRET,
          ...form.getHeaders(),
        },
      })
      .then(function (response: any) {
        tmpFile.removeCallback();
        return 'ipfs://' + response.data.IpfsHash;
      })
      .catch(function (error: any) {
        Logger.error(`failed to pin content from uri to ipfs, err: ${error}`);
        tmpFile.removeCallback();
        throw error;
      });
  }

  async #pinJson(jsonData: string): Promise<string> {
    return axios
      .post('https://api.pinata.cloud/pinning/pinJSONToIPFS', jsonData, {
        headers: {
          pinata_api_key: this.PINATA_API_KEY,
          pinata_secret_api_key: this.PINATA_API_SECRET,
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
}
