import { Repository } from 'typeorm/repository/Repository';
import { NftEntity } from 'src/nft/entity/nft.entity';
import { NftDto } from '../dto/nft.dto';
export declare class NftService {
    private readonly nftRepository;
    constructor(nftRepository: Repository<NftEntity>);
    create(nft: NftDto): Promise<NftEntity>;
    edit(nft: NftDto): Promise<NftEntity>;
    findAll(): Promise<NftEntity[]>;
    findByCategories(categoryName: string | string[], skip: number): Promise<NftEntity[]>;
}
