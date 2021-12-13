import { Module } from '@nestjs/common';
import { NftService } from './nft.service';
import { NftController } from './nft.controller';
import { DbModule } from 'src/db.module';
import { JoiPipeModule } from 'nestjs-joi';

@Module({
  imports: [DbModule, JoiPipeModule],
  controllers: [NftController],
  providers: [NftService],
})
export class NftModule {}
