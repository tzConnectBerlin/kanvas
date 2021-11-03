import { Repository } from 'typeorm/repository/Repository';
import { AuthProviderEntity } from '../entity/auth-provider.entity';
export declare class AuthProviderService {
    private readonly userRepository;
    constructor(userRepository: Repository<AuthProviderEntity>);
    create(user: AuthProviderEntity): Promise<AuthProviderEntity>;
    findAll(): Promise<AuthProviderEntity[]>;
}
