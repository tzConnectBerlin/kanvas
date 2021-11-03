import { UserDto as User } from '../dto/user.dto';
import { UserService } from '../service/user.service';
export declare class UserController {
    private userService;
    constructor(userService: UserService);
    create(user: User): Promise<User>;
    findAll(): Promise<User[]>;
}
