import { Module } from '@nestjs/common';
import { NftService } from './nft.service';
import { NftController } from './nft.controller';
import { DbModule } from 'src/db.module';
import { JoiPipeModule } from 'nestjs-joi';
import { S3Service } from './s3.service';
import { RoleService } from 'src/role/role.service';

@Module({
  imports: [DbModule, JoiPipeModule],
  controllers: [NftController],
  providers: [S3Service, NftService, RoleService],
})
export class NftModule {}
