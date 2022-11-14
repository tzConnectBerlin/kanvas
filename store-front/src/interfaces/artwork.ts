import { ICategory } from './category';

export interface IArtwork {
    title: string;
    url: string;
}

export interface INft {
    id: number;
    name: string;
    artistName?: string;
    description: string;
    ipfsHash?: string;
    displayUri: string;
    price: number;
    creator?: string;
    startDate?: string;
    editionsAvailable: string;
    editionsSize: string;
    launchAt?: number;
    categories: ICategory[];
    ownerStatuses?: ('pending' | 'owned')[]
}
