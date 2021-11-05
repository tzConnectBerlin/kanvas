import { Module } from '@nestjs/common';
import { UserController } from './controller/user.controller';
import { UserService } from './service/user.service';
// import { UserEntity } from './entity/user.entity';

@Module({
    imports: [],
    controllers: [UserController],
    providers: [UserService]
})

export class UserModule { }
