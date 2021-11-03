import { NftDto } from "src/nft/dto/nft.dto";
import { CategoryEntity } from "../entity/category.entity";
export declare class CategoryDto {
    id: number;
    name: string;
    description: string;
    parent: CategoryEntity;
    nfts: NftDto[];
}
