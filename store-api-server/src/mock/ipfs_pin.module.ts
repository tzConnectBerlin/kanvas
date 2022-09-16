import { Module } from '@nestjs/common';
import { IPFS_PIN_PROVIDER } from '../constants.js';

class IpfsPinServiceMock {
  async pinUri(uri: string): Promise<string> {
    return `ipfs-mock://${uri}`;
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
