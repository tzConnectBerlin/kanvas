import { AuthProviderEntity } from "src/auth-provider/entity/auth-provider.entity";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('users')
export class UserEntity {
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column({ nullable: true})
    name: string;

    @Column({unique: true})
    address: string;

    @Column({unique: true})
    signedPayload: string;

}
