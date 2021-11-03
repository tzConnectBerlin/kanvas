import { NftService } from '../service/nft.service';
import { NftEntity } from 'src/nft/entity/nft.entity';
import { NftDto } from '../dto/nft.dto';
export declare class NftController {
    private nftService;
    constructor(nftService: NftService);
    create(nft: NftDto): Promise<NftEntity>;
    findAll(): Promise<NftEntity[]>;
    findByCategories(category: string, skip: number): Promise<NftEntity[]>;
}
