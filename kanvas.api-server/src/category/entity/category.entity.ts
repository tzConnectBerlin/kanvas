import { NftDto } from 'src/nft/dto/nft.dto';
import { NftEntity } from 'src/nft/entity/nft.entity';
import { Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CategoryDto } from '../dto/category.dto';

@Entity('categories')
export class CategoryEntity {
    @PrimaryGeneratedColumn()
    id: number;
     
    @Column()
    name: string;

    @Column()
    description: string;

    @OneToMany(() => CategoryEntity, category => category.id)
    parent: CategoryEntity;

    @ManyToMany(() => NftEntity, nft => nft.categories)
    nfts: NftEntity[];
}
