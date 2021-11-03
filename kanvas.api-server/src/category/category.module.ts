import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryController } from './controller/category.controller';
import { CategoryEntity } from './entity/category.entity';
import { CategoryService } from './service/category.service';
import { NftEntity } from 'src/nft/entity/nft.entity';

@Module({
  imports: [
  TypeOrmModule.forFeature([
      CategoryEntity,
      NftEntity
    ])
  ],
  controllers: [CategoryController],
  providers: [CategoryService]
})
export class CategoryModule {}
