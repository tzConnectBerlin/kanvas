import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('auth_provider')
export class AuthProviderEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

}
