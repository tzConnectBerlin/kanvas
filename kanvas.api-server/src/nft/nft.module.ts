import { Module } from '@nestjs/common';
import { NftController } from './controller/nft.controller';
import { NftEntity } from './entity/nft.entity';
import { NftService } from './service/nft.service';
import { CategoryEntity } from 'src/category/entity/category.entity';

@Module({
    imports: [],
    controllers: [NftController],
    providers: [NftService]
})
export class NftModule { }
