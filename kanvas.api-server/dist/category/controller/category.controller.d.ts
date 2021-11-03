import { CategoryEntity } from 'src/category/entity/category.entity';
import { CategoryService } from '../service/category.service';
export declare class CategoryController {
    private categoryService;
    constructor(categoryService: CategoryService);
    create(user: CategoryEntity): Promise<CategoryEntity>;
    findAll(): Promise<CategoryEntity[]>;
}
