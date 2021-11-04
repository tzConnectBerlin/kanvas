import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { JoinTable, ManyToMany } from "typeorm";
import { CategoryEntity } from 'src/category/entity/category.entity';
import { CategoryDto } from "src/category/dto/category.dto";

interface IMetadata {

}

@Entity('nfts')
export class NftEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ nullable: true})
    ipfsHash: string;

    @Column('jsonb')
    metadata: IMetadata;

    @Column()
    dataUrl: string;

    @Column()
    contract: string;

    @Column()
    tokenId: string;

    @JoinTable({ name: 'categories_nfts' })
    @ManyToMany(() => CategoryEntity, category => category.nfts)
    categories: CategoryDto[];

}
