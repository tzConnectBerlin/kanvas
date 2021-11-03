import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/service/user.service';
import { UserEntity } from 'src/user/entity/user.entity';
interface ITokenPayload {
    id: number;
    address: string;
}
interface IAuthentication {
    token: string;
    id: number;
    maxAge: string;
    address: string;
}
export declare class AuthenticationService {
    private readonly userService;
    private readonly jwtService;
    constructor(userService: UserService, jwtService: JwtService);
    private validate;
    login(userData: UserEntity): Promise<any | {
        status: number;
    }>;
    register(user: UserEntity): Promise<any>;
    private verifyPassword;
    getCookieWithJwtToken(data: ITokenPayload, user: UserEntity): IAuthentication;
}
export {};
