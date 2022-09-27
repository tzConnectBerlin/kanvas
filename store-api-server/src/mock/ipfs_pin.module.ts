import { Module } from '@nestjs/common';
import { IPFS_PIN_PROVIDER } from '../constants.js';

class IpfsPinServiceMock {
  async pinUri(uri: string): Promise<string> {
    // anything between 2 # is trimmed away to allow for testing different Uris that point to the same content => same ipfs hash
    return `ipfs-mock://${uri.replace(/#.*#/g, '').replace(/\..*$/, '')}`;
  }

  async pinJson(jsonData: any): Promise<string> {
    // This mock module assumes pinJson is only called for pinning NFT metadata
    return `ipfs-mock://${jsonData.name}`;
  }

  enabled(): boolean {
    return true;
  }
}

const ipfsPinning = {
  provide: IPFS_PIN_PROVIDER,
  useFactory: () => new IpfsPinServiceMock(),
};

@Module({
  providers: [ipfsPinning],
  exports: [ipfsPinning],
})
export class IpfsPinMock {}
