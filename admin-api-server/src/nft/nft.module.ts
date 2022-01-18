import { Module } from '@nestjs/common';
import { NftService } from './nft.service';
import { NftController } from './nft.controller';
import { DbModule } from 'src/db.module';
import { S3Service } from './s3.service';
import { RoleService } from 'src/role/role.service';

@Module({
  imports: [DbModule],
  controllers: [NftController],
  providers: [S3Service, NftService, RoleService],
})
export class NftModule {}
