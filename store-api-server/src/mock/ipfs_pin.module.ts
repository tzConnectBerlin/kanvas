import { Module } from '@nestjs/common';
import { IPFS_PIN_PROVIDER } from '../constants.js';

class IpfsPinServiceMock {
  async pinUri(uri: string): Promise<string> {
    return `ipfs://${uri}`;
  }

  async pinJson(jsonData: string): Promise<string> {
    return `ipfs://${JSON.parse(jsonData).name}`;
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
