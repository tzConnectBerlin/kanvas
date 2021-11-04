import { IsJSON, IsNumber, IsString } from "class-validator";
import { CategoryDto } from 'src/category/dto/category.dto';

export class NftDto {
    @IsNumber()
    id: number;

    @IsString()
    name: string;

    @IsString()
    ipfsHash: string;

    // Store the nft data in the db to prevent calling ipfs all the time.
    @IsJSON()
    metadata: JSON;

    @IsString()
    dataUrl: string;

    @IsString()
    contract: string;

    @IsString()
    tokenId: string;

    categories: CategoryDto[]
}
