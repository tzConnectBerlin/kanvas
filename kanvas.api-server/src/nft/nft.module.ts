import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NftController } from './controller/nft.controller';
import { NftEntity } from './entity/nft.entity';
import { NftService } from './service/nft.service';
import { CategoryEntity } from 'src/category/entity/category.entity';

@Module({
  imports: [
  TypeOrmModule.forFeature([
      NftEntity,
      CategoryEntity
    ])
  ],
  controllers: [NftController],
  providers: [NftService]
})
export class NftModule {}
