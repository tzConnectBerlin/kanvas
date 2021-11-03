import { Repository } from 'typeorm/repository/Repository';
import { CategoryEntity } from '../entity/category.entity';
export declare class CategoryService {
    private readonly categoryRepository;
    constructor(categoryRepository: Repository<CategoryEntity>);
    create(category: CategoryEntity): Promise<CategoryEntity>;
    findAll(): Promise<CategoryEntity[]>;
}
