import { Module } from '@nestjs/common';
import { RoleService } from './service/role.service';
import { RoleController } from './controller/role.controller';
import { DbModule } from 'src/db.module';

@Module({
  imports: [DbModule],
  controllers: [RoleController],
  providers: [RoleService, RoleService],
})
export class RoleModule {}
