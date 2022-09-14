import { Module } from '@nestjs/common';
import { NftController } from './controller/nft.controller.js';
import { NftService } from './service/nft.service.js';
import { NftIpfsService } from './service/ipfs.service.js';
import { CategoryService } from '../category/service/category.service.js';
import { DbModule } from '../db.module.js';
import { IpfsPinModule } from '../ipfs_pin.module.js';
import { CurrencyModule } from 'kanvas-api-lib';
import { MintService } from './service/mint.service.js';

@Module({
  imports: [DbModule, IpfsPinModule, CurrencyModule],
  controllers: [NftController],
  providers: [CategoryService, NftService, NftIpfsService, MintService],
  exports: [NftService, NftIpfsService, MintService],
})
export class NftModule {}
