import { Module } from '@nestjs/common';
import { NftController } from './controller/nft.controller';
import { NftService } from './service/nft.service';
import { CategoryService } from 'src/category/service/category.service';
import { DbModule } from 'src/db.module';

@Module({
  imports: [DbModule],
  controllers: [NftController],
  providers: [NftService, CategoryService],
})
export class NftModule {}
