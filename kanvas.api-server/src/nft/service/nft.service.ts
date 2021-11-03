import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import { getConnection, getManager } from 'typeorm';
import { Repository } from 'typeorm/repository/Repository';
import { NftEntity } from 'src/nft/entity/nft.entity';
import { CategoryEntity } from 'src/category/entity/category.entity';
import { NftDto } from '../dto/nft.dto';

@Injectable()
export class NftService {
    constructor(
        @InjectRepository(NftEntity)
        private readonly nftRepository: Repository<NftEntity>
    ) {}
    
    async create (nft: NftDto): Promise<NftEntity> {
        return this.nftRepository.save(nft);
    }

    async edit (nft: NftDto): Promise<NftEntity> {
        const manager = getManager()

        let concernedNft = await manager.findOne(NftEntity, { where: { id: nft.id}})

        if (!concernedNft) {
            throw new HttpException('Nft not found.', HttpStatus.NOT_FOUND)
        }

        concernedNft = nft

        return this.nftRepository.save(concernedNft);
    }

    async findAll (): Promise<NftEntity[]> {
        return this.nftRepository.find();
    }

    async findByCategories (categoryName: string | string[], skip: number): Promise<NftEntity[]> {
        const manager = await getManager()
        const connection = await getConnection()

        const category = await manager.findOne(CategoryEntity, {where: {name: categoryName}})

        if (!category) {
            throw new HttpException('Category not found.', HttpStatus.NOT_FOUND)
        }

        const nfts = await connection
								.createQueryBuilder(NftEntity,'nfts')
								.innerJoinAndSelect(
									'nfts.categories', 
									'categories'
								)
								.where('categories.name = :categoryName', { categoryName: categoryName })
								.take(12)
								.skip(skip)
								.getMany();
                
        console.log(nfts)

        if (!nfts) {
            throw new HttpException('No Nfts for this category.', HttpStatus.NOT_FOUND)
        }                   
        
        return nfts
    }
}
