import { JwtService } from '@nestjs/jwt';
import { UserEntity } from 'src/user/entity/user.entity';
import { UserService } from 'src/user/service/user.service';
import { ITokenPayload } from 'src/interfaces/token.interface';
interface IAuthentication {
    id: number;
    name: string;
    token: string;
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
    getLoggedUser(address: string): Promise<UserEntity>;
    register(user: UserEntity): Promise<any>;
    private verifyPassword;
    getCookieWithJwtToken(data: ITokenPayload, user: UserEntity): IAuthentication;
}
export {};
