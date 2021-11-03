import { NftEntity } from 'src/nft/entity/nft.entity';
export declare class CategoryEntity {
    id: number;
    name: string;
    description: string;
    parent: CategoryEntity;
    nfts: NftEntity[];
}
