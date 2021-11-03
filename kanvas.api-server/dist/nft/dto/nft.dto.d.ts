import { CategoryDto } from 'src/category/dto/category.dto';
export declare class NftDto {
    id: number;
    name: string;
    ipfsHash: string;
    metadata: JSON;
    dataUrl: string;
    contract: string;
    tokenId: string;
    categories: CategoryDto[];
}
