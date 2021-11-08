import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { UserEntity } from '../entity/user.entity'
import { UserService } from '../service/user.service'
import { JwtAuthGuard } from '../../authentication/guards/jwt-auth.guard'

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  async create(@Body() user: UserEntity): Promise<UserEntity> {
    return this.userService.create(user)
  }
}
