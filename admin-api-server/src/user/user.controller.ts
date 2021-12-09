import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserDto } from './dto/user.dto';
import { Roles } from 'src/role/role.decorator';
import { Role } from 'src/role/role';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/role/role.guard';
import { UpdateUserGuard } from './update-user.guard';
import { FilterParams } from 'src/types';
import { ParseJSONArrayPipe } from 'src/pipes/ParseJSONArrayPipe';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  create(@Body() createUserDto: UserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  findAll(
    @Query('sort', new ParseJSONArrayPipe())
    sort?: string[],
    @Query('filter', new ParseJSONArrayPipe()) filter?: FilterParams,
    @Query('range', new ParseJSONArrayPipe())
    range?: number[],
  ) {
    return this.userService.findAll({
      sort,
      filter,
      range,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard, UpdateUserGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
