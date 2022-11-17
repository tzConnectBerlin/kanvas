import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard.js';
import { Roles } from '../entities/role.entity.js';
import { RoleService } from '../service/role.service.js';

@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  /**
   * @apiGroup Role
   * @api {get} /role Request all roles
   * @apiPermission user
   * @apiHeader {String} Authorization Bearer Access Token.
   * @apiSuccessExample Example Success-Response:
   *   {
   *     "data": [
   *         {
   *             "id": 1,
   *             "role_label": "admin"
   *         },
   *         {
   *             "id": 2,
   *             "role_label": "editor"
   *         },
   *         {
   *             "id": 3,
   *             "role_label": "moderator"
   *         }
   *     ]
   *   }
   * @apiName findAll
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(): Promise<{ data: Roles[] }> {
    return { data: await this.roleService.getRoles() };
  }
}
