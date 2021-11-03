import { Repository } from 'typeorm/repository/Repository';
import { UserDto } from '../dto/user.dto';
import { UserEntity } from '../entity/user.entity';
export declare class UserService {
    private readonly userRepository;
    constructor(userRepository: Repository<UserEntity>);
    create(user: UserDto): Promise<UserDto>;
    findAll(): Promise<UserDto[]>;
    findByAddress(userAddress: string): Promise<UserEntity>;
}
