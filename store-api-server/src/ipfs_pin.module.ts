// Implementation of Pinata for uploading assets (files) and json structured data into IPFS
import { Module, Logger, Injectable, Inject } from '@nestjs/common';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import { createReadStream, createWriteStream } from 'fs';
import FormData from 'form-data';
import * as tmp from 'tmp';
import {
  IPFS_PIN_PROVIDER,
  PINATA_API_KEY,
  PINATA_API_SECRET,
} from './constants.js';

axiosRetry(axios, {
  retries: 3,
});

export class PinataService {
  enabled(): boolean {
    if (typeof PINATA_API_KEY === 'undefined') {
      Logger.warn(
        `failed to upload NFT to IPFS, NftIpfsService not enabled: PINATA_API_KEY env var not set`,
      );
      return false;
    }
    if (typeof PINATA_API_SECRET === 'undefined') {
      Logger.warn(
        `failed to upload NFT to IPFS, NftIpfsService not enabled: PINATA_API_SECRET env var not set`,
      );
      return false;
    }
    return true;
  }

  async pinUri(uri: string): Promise<string> {
    const tmpFile = tmp.fileSync();
    const tmpFileName = tmpFile.name;

    await this.#downloadFile(uri, tmpFileName);

    const form = new FormData();
    form.append('file', createReadStream(tmpFileName));

    return axios
      .post('https://api.pinata.cloud/pinning/pinFileToIPFS', form, {
        maxBodyLength: 1000000000, //this is needed to prevent axios from erroring with large files
        headers: {
          pinata_api_key: PINATA_API_KEY || '',
          pinata_secret_api_key: PINATA_API_SECRET || '',
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

  async pinJson(jsonData: string): Promise<string> {
    return axios
      .post('https://api.pinata.cloud/pinning/pinJSONToIPFS', jsonData, {
        headers: {
          pinata_api_key: PINATA_API_KEY || '',
          pinata_secret_api_key: PINATA_API_SECRET || '',
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

  async #downloadFile(uri: string, targetFile: string) {
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
}

const ipfsPinning = {
  provide: IPFS_PIN_PROVIDER,
  useFactory: () => new PinataService(),
};

@Module({
  providers: [ipfsPinning],
  exports: [ipfsPinning],
})
export class IpfsPinModule {}
