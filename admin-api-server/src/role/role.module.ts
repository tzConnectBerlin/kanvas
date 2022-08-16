import { Module } from '@nestjs/common';
import { RoleService } from './service/role.service.js';
import { RoleController } from './controller/role.controller.js';
import { DbModule } from '../db.module.js';

@Module({
  imports: [DbModule],
  controllers: [RoleController],
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}
