import { Module } from '@nestjs/common';
import { NftService } from './service/nft.service';
import { NftController } from './controller/nft.controller';
import { DbModule } from 'src/db.module';
import { S3Service } from './service/s3.service';
import { CategoryService } from 'src/category/service/category.service';
import { RoleService } from 'src/role/service/role.service';

@Module({
  imports: [DbModule],
  controllers: [NftController],
  providers: [S3Service, NftService, RoleService, CategoryService],
})
export class NftModule {}
