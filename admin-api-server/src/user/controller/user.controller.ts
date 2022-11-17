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
import { UserService } from '../service/user.service.js';
import { RolesDecorator } from '../../role/role.decorator.js';
import { Roles } from '../../role/entities/role.entity.js';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard.js';
import { RolesGuard } from '../../role/role.guard.js';
import { ParseJSONPipe } from '../../pipes/ParseJSONPipe.js';
import { UserFilterParams, UserFilters } from '../params.js';
import { UserEntity } from '../entities/user.entity.js';
import {
  queryParamsToPaginationParams,
  validatePaginationParams,
} from '../../utils.js';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * @apiGroup User
   * @api {post} /user Create a user
   * @apiPermission admin
   * @apiBody {UserEntity} user The user to be created.
   * @apiParamExample {json} Request Body Example:
   *    {
   *      "email": "max@muster.com",
   *      "userName": "MaxMuster",
   *      "roles": [1, 2],
   *      "password": "123456",
   *      "disabled": false
   *    }
   * @apiSuccessExample Example Success-Response:
   *   {
   *     "id": 103,
   *     "roles": [
   *         1,
   *         2
   *     ],
   *     "email": "max@muster.com",
   *     "userName": "MaxMuster",
   *     "disabled": false
   *   }
   * @apiName create
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesDecorator(Roles.admin)
  async create(@Body() usr: UserEntity): Promise<UserEntity> {
    return await this.userService.create(usr);
  }

  /**
   * @apiGroup User
   * @api {get} /user Request all users
   * @apiPermission user
   * @apiQuery {Object="id: number[]","userName: string[]","roleIds: number[]"} [filter] URL-decoded example: filter: {"id":[1,20]}
   * @apiQuery {String[]="id","userName","email","roles"} [sort] URL-decoded examples: sort: [$value,"desc"] or sort: [$value,"asc"]
   * @apiQuery {Number[]="[number, number] e.g. [10, 5]"} [range] URL-decoded example: range: [10, 5] results in 5 records from the 10th record on
   *
   * @apiSuccessExample Example Success-Response:
   *    {
   *     "data": [
   *         {
   *             "id": 1,
   *             "email": "admin@tzconnect.com",
   *             "userName": "admin",
   *             "roles": [
   *                 1
   *             ]
   *         },
   *         {
   *             "id": 20,
   *             "email": "moderator@tzconnect.com",
   *             "userName": "moderator",
   *             "roles": [
   *                 3
   *             ]
   *         },
   *         ...
   *     ],
   *     "count": 10
   * }
   * @apiName findAll
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Query() filters: UserFilters,
    @Query('sort', new ParseJSONPipe())
    sort?: [string, 'asc' | 'desc'],
    @Query('range', new ParseJSONPipe())
    range?: number[],
  ) {
    const params = this.#queryParamsToFilterParams(filters, sort, range);

    validatePaginationParams(params, ['id', 'email', 'userName', 'roles']);

    return await this.userService.findAll(params);
  }

  /**
   * @apiGroup User
   * @api {get} /user/:id Request a single user
   * @apiPermission user
   * @apiParam {Number} id Unique ID of user
   * @apiSuccessExample Example Success-Response:
   *   {
   *     "id": 1,
   *     "email": "admin@tzconnect.com",
   *     "userName": "admin",
   *     "roles": [
   *         1
   *     ]
   * }
   * @apiExample {http} Example http request url (make sure to replace $base_url with the admin-api-server endpoint):
   *  $base_url/user/5
   * @apiName findOne
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    return await this.userService.findOne(+id);
  }

  /**
   * @apiGroup User
   * @api {patch} /user/:id Update a single user
   * @apiPermission admin
   * @apiParam {Number} id Unique ID of user
   * @apiBody {UserEntity} user The updated user entity. Currently only role updates are enabled.
   * @apiParamExample {json} Request Body Example for updating roles:
   *    {
   *      "roles": [1, 2, 3]
   *    }
   *
   * @apiSuccessExample Example Success-Response:
   *   {
   *     "id": 1,
   *     "email": "admin@tzconnect.com",
   *     "userName": "admin",
   *     "roles": [
   *         1, 2, 3
   *     ]
   * }
   * @apiExample {http} Example http request url (make sure to replace $base_url with the admin-api-server endpoint):
   *  $base_url/user/5
   * @apiName update
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesDecorator(Roles.admin)
  async update(@Param('id') id: number, @Body() updateUser: UserEntity) {
    try {
      return await this.userService.update(+id, updateUser);
    } catch (error) {
      Logger.error(`Unable to update the user, error: ${error}`);
      throw new HttpException('Unable to update user', HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * @apiGroup User
   * @api {delete} /user/:id Delete a single user
   * @apiPermission admin
   * @apiParam {Number} id Unique ID of user
   * @apiExample {http} Example http request url (make sure to replace $base_url with the admin-api-server endpoint):
   *  $base_url/user/5
   * @apiName remove
   */
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
