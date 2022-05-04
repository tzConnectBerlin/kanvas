import { Module } from '@nestjs/common';
import { NftController } from './controller/nft.controller';
import { NftService } from './service/nft.service';
import { IpfsService } from './service/ipfs.service';
import { CategoryModule } from 'src/category/category.module';
import { DbModule } from 'src/db.module';
import { CurrencyModule } from 'src/currency.module';
import { MintService } from './service/mint.service';

@Module({
  imports: [DbModule, CategoryModule, CurrencyModule],
  controllers: [NftController],
  providers: [NftService, IpfsService, MintService],
  exports: [NftService, IpfsService, MintService],
})
export class NftModule {}
