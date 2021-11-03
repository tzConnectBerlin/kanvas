import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import { Repository } from 'typeorm/repository/Repository';
import { CategoryDto } from '../dto/category.dto';
import { CategoryEntity } from '../entity/category.entity';

@Injectable()
export class CategoryService {
    constructor(
        @InjectRepository(CategoryEntity)
        private readonly categoryRepository: Repository<CategoryEntity>
    ) {}
    
    async create (category: CategoryEntity): Promise<CategoryEntity> {
        return this.categoryRepository.save(category);
    }

    async findAll (): Promise<CategoryEntity[]> {
        return this.categoryRepository.find();
    }
}
