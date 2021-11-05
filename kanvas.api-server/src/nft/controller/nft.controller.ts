import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { NftService } from '../service/nft.service';
import { NftEntity } from 'src/nft/entity/nft.entity';
import { NftDto } from '../dto/nft.dto';

@Controller('nfts')
export class NftController {
    constructor(private nftService: NftService) { }

    @Post()
    async create(@Body() nft: NftDto): Promise<NftEntity> {
        return this.nftService.create(nft);
    }

    @Get()
    async findAll(): Promise<NftEntity[]> {
        return this.nftService.findAll();
    }
}
