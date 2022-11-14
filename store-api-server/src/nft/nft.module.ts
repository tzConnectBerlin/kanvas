import { Module } from '@nestjs/common';
import { NftController } from './controller/nft.controller.js';
import { NftService } from './service/nft.service.js';
import { NftIpfsService } from './service/ipfs.service.js';
import { CategoryService } from '../category/service/category.service.js';
import { DbModule } from '../db.module.js';
import { IpfsPinModule } from '../ipfs_pin.module.js';
import { MintService } from './service/mint.service.js';
import { IpfsPinMock } from '../mock/ipfs_pin.module.js';
import { MOCK_IPFS_PINNING } from '../constants.js';

@Module({
  imports: [DbModule, MOCK_IPFS_PINNING ? IpfsPinMock : IpfsPinModule],
  controllers: [NftController],
  providers: [CategoryService, NftService, NftIpfsService, MintService],
  exports: [NftService, NftIpfsService, MintService],
})
export class NftModule {}
