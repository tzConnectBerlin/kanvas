import { Module } from '@nestjs/common';
import { NftService } from './service/nft.service';
import { NftController } from './controller/nft.controller';
import { DbModule } from 'src/db.module';
import { S3Service } from './service/s3.service';
import { CategoryModule } from 'src/category/category.module';
import { RoleModule } from 'src/role/role.module';

@Module({
  imports: [DbModule, CategoryModule, RoleModule],
  controllers: [NftController],
  providers: [S3Service, NftService],
})
export class NftModule {}
