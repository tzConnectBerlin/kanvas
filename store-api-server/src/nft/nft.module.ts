import { Module } from '@nestjs/common';
import { NftController } from './controller/nft.controller';
import { NftService } from './service/nft.service';
import { DbModule } from 'src/db.module';

@Module({
  imports: [DbModule],
  controllers: [NftController],
  providers: [NftService],
})
export class NftModule {}
