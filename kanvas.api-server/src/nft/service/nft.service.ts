import { Injectable } from '@nestjs/common';
import { NftEntity } from 'src/nft/entity/nft.entity';
import { NftDto } from '../dto/nft.dto';

@Injectable()
export class NftService {
    async create(_nft: NftDto): Promise<NftEntity> {
        throw new Error("Not yet implemented - let's implement it when we need it rather than have a big generated code blob")
    }
    async edit(_nft: NftDto): Promise<NftEntity> {
        throw new Error("Not yet implemented - let's implement it when we need it rather than have a big generated code blob")
    }
    async findAll(): Promise<NftEntity[]> {
        throw new Error("Not yet implemented - let's implement it when we need it rather than have a big generated code blob")
    }
}
