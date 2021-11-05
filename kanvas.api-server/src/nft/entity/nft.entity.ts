import { CategoryDto } from "src/category/dto/category.dto"; // TODO remove all DTO and just use simple immutable data

// TODO let's replace this and all other models with just a simple immutable key/value object - preferably using Immutable.js
export class NftEntity {
    id: number;
    name: string;
    ipfsHash: string;
    metadata: any;		// TODO wut
    dataUrl: string;
    contract: string;
    tokenId: string;
    categories: CategoryDto[];
}
