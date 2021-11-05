import { Module } from '@nestjs/common';
import { AuthProviderEntity } from './entity/auth-provider.entity';
import { AuthProviderService } from './service/auth-provider.service';

@Module({
    imports: [],
    providers: [AuthProviderService]
})
export class AuthProviderModule { }
