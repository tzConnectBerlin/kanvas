import { Injectable, Inject } from '@nestjs/common';
import {
  IPFS_NODE,
  STORE_SYMBOL,
  STORE_PUBLISHERS,
  MINTER_ADDRESS,
} from 'src/constants';
import { NftEntity } from 'src/nft/entity/nft.entity';
import { create, urlSource } from 'ipfs-http-client';
const axios = require('axios');
import { createReadStream, createWriteStream } from 'fs';
const https = require('https');
const FormData = require('form-data');
const tmp = require('tmp');
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

async function pinUriToIPFS(
  pinataApiKey: string,
  pinataSecretApiKey: string,
  uri: string,
): Promise<string> {
  const tmpFile = tmp.fileSync();
  const tmpFileName = tmpFile.name;
  console.log(tmpFile);

  await downloadFile(uri, tmpFileName);

  const form = new FormData();
  form.append('file', createReadStream(tmpFileName));

  return axios
    .post('https://api.pinata.cloud/pinning/pinFileToIPFS', form, {
      headers: {
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecretApiKey,
        ...form.getHeaders(),
      },
    })
    .then(function (response: any) {
      tmpFile.removeCallback();
      return 'ipfs://' + response.data.IpfsHash;
    })
    .catch(function (error: any) {
      tmpFile.removeCallback();
      throw error;
    });
}

@Injectable()
export class IpfsService {
  PINATA_API_KEY = assertEnv('PINATA_API_KEY');
  PINATA_API_SECRET = assertEnv('PINATA_API_SECRET');

  async uploadNft(nft: NftEntity): Promise<string> {
    const url = nft.dataUri; // .split('?')[0];
    console.log('url: {}', url);

    const [/*thumbnailIpfs, */ displayIpfs] = await Promise.all([
      pinUriToIPFS(this.PINATA_API_KEY, this.PINATA_API_SECRET, url),
      // ipfsCli.add(urlSource(url)), // todo: insert thumbnailUri here instead
    ]);

    const metadata = this.#nftMetadataJSON(
      nft,
      displayIpfs,
      displayIpfs,
      //thumbnailIpfs.cid.toString(),
    );
    console.log(metadata);
    //process.exit();

    return axios
      .post('https://api.pinata.cloud/pinning/pinJSONToIPFS', metadata, {
        headers: {
          pinata_api_key: this.PINATA_API_KEY,
          pinata_secret_api_key: this.PINATA_API_SECRET,
        },
      })
      .then(function (response: any) {
        return 'ipfs://' + response.data.IpfsHash;
      })
      .catch(function (error: any) {
        console.log(error);
        throw error;
      });
  }

  #nftMetadataJSON(
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
      creators: [],
      contributors: [],
      publishers: STORE_PUBLISHERS,
    };
  }
}
