import { Module } from '@nestjs/common';
import { JoiPipeModule } from 'nestjs-joi';
import { UserService } from './service/user.service';
import { UserController } from './controller/user.controller';
import { DbModule } from 'src/db.module';

@Module({
  imports: [DbModule, JoiPipeModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
