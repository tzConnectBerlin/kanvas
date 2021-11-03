import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getManager } from 'typeorm';
import { Repository } from 'typeorm/repository/Repository';
import { UserDto } from '../dto/user.dto';
import { UserEntity } from '../entity/user.entity';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepository: Repository<UserEntity>
    ) {}
    
    async create (user: UserDto): Promise<UserDto> {
        return this.userRepository.save(user);
    }

    async findAll (): Promise<UserDto[]> {
        return this.userRepository.find();
    }

    async findByAddress(userAddress: string): Promise<UserEntity> {
        const manager = getManager()

        const user = await manager.findOne(UserEntity, { where: {address: userAddress}})
        
        if (!user) {
            console.log('exce[roipn')
            throw new HttpException('User not registered.', HttpStatus.NOT_FOUND)
        }
        console.log('nop exception')
        return user
    }

}
