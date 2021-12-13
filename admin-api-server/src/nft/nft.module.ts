import { Module } from '@nestjs/common';
import { NftService } from './nft.service';
import { NftController } from './nft.controller';
import { DbModule } from 'src/db.module';

@Module({
  imports: [DbModule],
  controllers: [NftController],
  providers: [NftService],
})
export class NftModule {}
