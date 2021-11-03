import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import { Repository } from 'typeorm/repository/Repository';
import { AuthProviderEntity } from '../entity/auth-provider.entity';

@Injectable()
export class AuthProviderService {
    constructor(
        @InjectRepository(AuthProviderEntity)
        private readonly userRepository: Repository<AuthProviderEntity>
    ) {}
    
    async create (user: AuthProviderEntity): Promise<AuthProviderEntity> {
        return this.userRepository.save(user);
    }

    async findAll (): Promise<AuthProviderEntity[]> {
        return this.userRepository.find();
    }
}
