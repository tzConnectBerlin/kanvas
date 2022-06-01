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
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import { UserService } from '../service/user.service';
import { RolesDecorator } from 'src/role/role.decorator';
import { Roles } from 'src/role/entities/role.entity';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/role/role.guard';
import { ParseJSONArrayPipe } from 'src/pipes/ParseJSONArrayPipe';
import { UserFilterParams, UserFilters } from '../params';
import { UserEntity } from '../entities/user.entity';
import {
  queryParamsToPaginationParams,
  validatePaginationParams,
} from 'src/utils';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesDecorator(Roles.admin)
  async create(@Body() usr: UserEntity): Promise<UserEntity> {
    return await this.userService.create(usr);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Query() filters: UserFilters,
    @Query('sort', new ParseJSONArrayPipe())
    sort?: [string, 'asc' | 'desc'],
    @Query('range', new ParseJSONArrayPipe())
    range?: number[],
  ) {
    const params = this.#queryParamsToFilterParams(filters, sort, range);

    validatePaginationParams(params, [
      'id',
      'email',
      'userName',
      'roles',
    ]);

    return await this.userService.findAll(params);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    return await this.userService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesDecorator(Roles.admin)
  async update(@Param('id') id: string, @Body() updateUser: any) {
    try {
      return await this.userService.update(+id, updateUser);
    } catch (error) {
      Logger.error(`Unable to update the user, error: ${error}`);
      throw new HttpException('Unable to update user', HttpStatus.BAD_REQUEST);
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesDecorator(Roles.admin)
  remove(@Param('id') id: string) {
    return this.userService.remove(Number(id));
  }

  #queryParamsToFilterParams(
    filters: UserFilters,
    sort?: string[],
    range?: number[],
  ) {
    return {
      ...new UserFilterParams(),
      ...queryParamsToPaginationParams(sort, range),
      filters: filters,
    };
  }
}
