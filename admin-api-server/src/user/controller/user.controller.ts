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
  Response,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import { UserService } from '../service/user.service';
import { Roles } from 'src/role/role.decorator';
import { Role } from 'src/role/role';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/role/role.guard';
import { UpdateUserGuard } from '../update-user.guard';
import { ParseJSONArrayPipe } from 'src/pipes/ParseJSONArrayPipe';
import { Response as Resp } from 'express';
import { UserFilterParams, UserFilters } from '../params';
import { queryParamsToPaginationParams, validatePaginationParams } from 'src/utils';

export interface UserProps {
  id: number;
  email: string;
  userName: string;
  address: string;
  password?: string;
  roles: number[];
}

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  create(@Body() createUser: UserProps) {
    return this.userService.create(createUser);
  }

  @Get()
  async findAll(
    @Response() resp: Resp,
    @Query() filters: UserFilters,
    @Query('sort', new ParseJSONArrayPipe())
    sort?: [string, 'asc' | 'desc'],
    @Query('range', new ParseJSONArrayPipe())
    range?: number[],
  ) {
    const params = this.#queryParamsToFilterParams(filters, sort, range)

    validatePaginationParams(params, ['id', 'email', 'userName', 'address', 'roles'])

    const result = await this.userService.findAll(params);

    return resp.set({
      'Access-Control-Expose-Headers': "Content-Range",
      'Content-range': result.count
    }).json({ data: result.users })
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard, UpdateUserGuard)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUser: any) {
    try {
      return await this.userService.update(+id, updateUser);
    } catch (error) {
      Logger.error(`Unable to update the user, error: ${error}`)
      throw new HttpException(
        'Unable to update user',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }

  #queryParamsToFilterParams(
    filters: UserFilters,
    sort?: string[],
    range?: number[]
  ) {
    return {
      ...new UserFilterParams(),
      ...queryParamsToPaginationParams(sort, range),
      filters: filters
    }
  }
}
