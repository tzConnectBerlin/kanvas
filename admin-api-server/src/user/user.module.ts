import { Module } from '@nestjs/common';
import { JoiPipeModule } from 'nestjs-joi';
import { UserService } from './service/user.service.js';
import { UserController } from './controller/user.controller.js';
import { DbModule } from '../db.module.js';

@Module({
  imports: [DbModule, JoiPipeModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
