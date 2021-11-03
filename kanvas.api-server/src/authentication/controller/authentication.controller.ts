import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "src/decoraters/user.decorator";
import { UserEntity } from "src/user/entity/user.entity";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { AuthenticationService } from "../service/authentication.service";

@Controller('auth')
export  class  AuthenticationController {
    constructor(private  readonly  authService:  AuthenticationService) {}

    @Get('logged_user')
    @UseGuards(JwtAuthGuard)
    async loggedUser(@CurrentUser() currentUser: UserEntity): Promise<any> {    
      return this.authService.getLoggedUser(currentUser.address);
    } 

    @Post('login')
    async login(@Body() user: UserEntity): Promise<any> {
      return this.authService.login(user);
    }  

    @Post('register')
    async register(@Body() user: UserEntity): Promise<any> {
      return this.authService.register(user);
    } 
}
