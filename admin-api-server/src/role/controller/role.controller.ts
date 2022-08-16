import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard.js';
import { Roles } from '../entities/role.entity.js';
import { RoleService } from '../service/role.service.js';

@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(): Promise<{ data: Roles[] }> {
    return { data: await this.roleService.getRoles() };
  }
}
