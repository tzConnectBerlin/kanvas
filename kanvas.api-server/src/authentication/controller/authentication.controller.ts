import { Body, Controller, Post } from "@nestjs/common";
import { UserEntity } from "src/user/entity/user.entity";
import { AuthenticationService } from "../service/authentication.service";

@Controller('auth')
export  class  AuthenticationController {
    constructor(private  readonly  authService:  AuthenticationService) {}

    @Post('login')
    async login(@Body() user: UserEntity): Promise<any> {
      return this.authService.login(user);
    }  

    @Post('register')
    async register(@Body() user: UserEntity): Promise<any> {
      return this.authService.register(user);
    } 
}
