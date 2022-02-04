import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { Roles } from '../entities/role.entity';
import { RoleService } from '../service/role.service';

@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(): Promise<{ data: Roles[] }> {
    return { data: await this.roleService.getRoles() };
  }
}
