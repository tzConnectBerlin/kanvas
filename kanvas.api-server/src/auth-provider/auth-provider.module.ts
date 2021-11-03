import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthProviderEntity } from './entity/auth-provider.entity';
import { AuthProviderService } from './service/auth-provider.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AuthProviderEntity
    ])
  ],
  providers: [AuthProviderService]
})
export class AuthProviderModule {}
