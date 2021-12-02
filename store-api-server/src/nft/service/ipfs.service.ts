import { Injectable, Inject } from '@nestjs/common';
import {
  IPFS_NODE,
  STORE_SYMBOL,
  STORE_PUBLISHERS,
  MINTER_ADDRESS,
} from 'src/constants';
import { NftEntity } from 'src/nft/entity/nft.entity';
import { create, urlSource } from 'ipfs-http-client';

@Injectable()
export class IpfsService {
  async uploadNft(nft: NftEntity): Promise<string> {
    const ipfsCli = create({
      url: 'https://d-art.mypinata.cloud/ipfs://d-art.mypinata.cloud',
      apiPath: '/ipfs',
    });

    console.log('url: {}', nft.dataUri);

    const [thumbnailIpfs, displayIpfs] = await Promise.all([
      ipfsCli.add(urlSource(nft.dataUri)),
      ipfsCli.add(urlSource(nft.dataUri)), // todo: insert thumbnailUri here instead
    ]);

    const metadata = this.#nftMetadataJSON(
      nft,
      displayIpfs.cid.toString(),
      thumbnailIpfs.cid.toString(),
    );
    console.log(metadata);
    process.exit();

    const metadataIpfs = await ipfsCli.add(JSON.stringify(metadata));

    return metadataIpfs.cid.toString();
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
