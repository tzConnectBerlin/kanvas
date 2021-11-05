import { Body, Controller, Get, Post } from '@nestjs/common';
import { NftService } from '../service/nft.service';
import { NftEntity } from 'src/nft/entity/nft.entity';

@Controller('nfts')
export class NftController {
    constructor(private nftService: NftService) { }

    @Post()
    async create(@Body() nft: NftEntity): Promise<NftEntity> {
        return this.nftService.create(nft);
    }

    @Get()
    async findAll(): Promise<NftEntity[]> {
        return this.nftService.findAll();
    }
}
