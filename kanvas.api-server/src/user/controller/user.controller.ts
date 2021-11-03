import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UserDto as User } from '../dto/user.dto';
import { UserService } from '../service/user.service';
import { JwtAuthGuard } from '../../authentication/guards/jwt-auth.guard';

@Controller('users')
export class UserController {
    constructor (private userService: UserService) {}

    @Post()
    async create(@Body() user: User): Promise<User> {
        return this.userService.create(user);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    async findAll(): Promise<User[]> {
        return this.userService.findAll();
    }
    
}
