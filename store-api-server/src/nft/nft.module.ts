import { Module } from '@nestjs/common';
import { NftController } from './controller/nft.controller.js';
import { NftService } from './service/nft.service.js';
import { IpfsService } from './service/ipfs.service.js';
import { CategoryModule } from '../category/category.module.js';
import { DbModule } from '../db.module.js';
import { CurrencyModule } from 'kanvas-api-lib';
import { MintService } from './service/mint.service.js';

@Module({
  imports: [DbModule, CategoryModule, CurrencyModule],
  controllers: [NftController],
  providers: [NftService, IpfsService, MintService],
  exports: [NftService, IpfsService, MintService],
})
export class NftModule {}
