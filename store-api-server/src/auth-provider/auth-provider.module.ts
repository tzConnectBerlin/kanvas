import { Module } from '@nestjs/common';
import { AuthProviderEntity } from './entity/auth-provider.entity.js';
import { AuthProviderService } from './service/auth-provider.service.js';

@Module({
  imports: [],
  providers: [AuthProviderService],
})
export class AuthProviderModule {}
