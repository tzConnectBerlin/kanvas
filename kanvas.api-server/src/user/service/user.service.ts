import { UserDto } from '../dto/user.dto';
import { UserEntity } from '../entity/user.entity';

export class UserService {
    async create(_user: UserDto): Promise<UserDto> {
        throw new Error("Not yet implemented") // TODO make a query here and parse the result
    }

    async findAll(): Promise<UserDto[]> {
        throw new Error("Not yet implemented") // TODO make a query here and parse the result
    }

    async findByAddress(_userAddress: string): Promise<UserEntity> {
        throw new Error("Not yet implemented") // TODO make a query here and parse the result
    }
}
