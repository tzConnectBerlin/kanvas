import { Injectable } from '@nestjs/common'
import { CategoryEntity } from '../entity/category.entity'

@Injectable()
export class CategoryService {
  async create(_category: CategoryEntity): Promise<CategoryEntity> {
    throw new Error('Not implemented yet')
  }
  async findAll(): Promise<CategoryEntity[]> {
    // TODO
    throw new Error('Not implemented yet')
  }
}
