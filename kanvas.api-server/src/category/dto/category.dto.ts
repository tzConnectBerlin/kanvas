import { NftDto } from "src/nft/dto/nft.dto";
import { IsNumber, IsString } from "class-validator";
import { CategoryEntity } from "../entity/category.entity";
import { NftEntity } from "src/nft/entity/nft.entity";

export class CategoryDto {
    @IsNumber()
    id: number;

    @IsString()
    name: string;

    @IsString()
    description: string;

    parent: CategoryEntity;

    nfts: NftDto[];
}
