import { CategoryDto } from "src/category/dto/category.dto";
interface IMetadata {
}
export declare class NftEntity {
    id: number;
    name: string;
    ipfsHash: string;
    metadata: IMetadata;
    dataUrl: string;
    contract: string;
    tokenId: string;
    categories: CategoryDto[];
}
export {};
