import { UserEntity } from "src/user/entity/user.entity";
import { AuthenticationService } from "../service/authentication.service";
export declare class AuthenticationController {
    private readonly authService;
    constructor(authService: AuthenticationService);
    login(user: UserEntity): Promise<any>;
    register(user: UserEntity): Promise<any>;
}
