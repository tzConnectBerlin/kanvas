import { Test, TestingModule } from '@nestjs/testing'
import { CategoryService } from './category.service'
import { DbMockModule } from '../../db_mock.module'

describe('CategoryService', () => {
  let service: CategoryService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DbMockModule],
      providers: [CategoryService],
    }).compile()

    service = module.get<CategoryService>(CategoryService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  const categoryTransformTests = [
    {
      name: 'empty input => empty output',
      categoryRows: [],
      expectRes: [],
    },
    {
      name: 'only root inputs => non nested results',
      categoryRows: [
        {
          id: 1,
          category: 'dust',
          description: '...',
          parent: undefined,
        },
        {
          id: 2,
          category: 'light',
          description: 'bright',
          parent: undefined,
        },
      ],
      expectRes: [
        {
          id: 1,
          name: 'dust',
          description: '...',
          subCategories: [],
        },
        {
          id: 2,
          name: 'light',
          description: 'bright',
          subCategories: [],
        },
      ],
    },
    {
      name: 'single subcategory',
      categoryRows: [
        {
          id: 2,
          category: 'light',
          description: 'bright',
          parent: 1,
        },
        {
          id: 1,
          category: 'dust',
          description: '...',
          parent: undefined,
        },
      ],
      expectRes: [
        {
          id: 1,
          name: 'dust',
          description: '...',
          subCategories: [
            {
              id: 2,
              name: 'light',
              description: 'bright',
              subCategories: [],
            },
          ],
        },
      ],
    },
    {
      name: 'nested subcategory',
      categoryRows: [
        {
          id: 3,
          category: 'material',
          description: 'matter',
          parent: 2,
        },
        {
          id: 2,
          category: 'light',
          description: 'bright',
          parent: 1,
        },
        {
          id: 1,
          category: 'dust',
          description: '...',
          parent: undefined,
        },
      ],
      expectRes: [
        {
          id: 1,
          name: 'dust',
          description: '...',
          subCategories: [
            {
              id: 2,
              name: 'light',
              description: 'bright',
              subCategories: [
                {
                  id: 3,
                  name: 'material',
                  description: 'matter',
                  subCategories: [],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'nested subcategory (w/ sibling in each depth)',
      categoryRows: [
        {
          id: 3,
          category: 'material',
          description: 'matter',
          parent: 2,
        },
        {
          id: 5,
          category: 'anti material',
          description: 'nonmatter',
          parent: 2,
        },
        {
          id: 2,
          category: 'light',
          description: 'bright',
          parent: 1,
        },
        {
          id: 4,
          category: 'anti light',
          description: 'dark',
          parent: 1,
        },
        {
          id: 1,
          category: 'dust',
          description: '...',
          parent: undefined,
        },
      ],
      expectRes: [
        {
          id: 1,
          name: 'dust',
          description: '...',
          subCategories: [
            {
              id: 2,
              name: 'light',
              description: 'bright',
              subCategories: [
                {
                  id: 3,
                  name: 'material',
                  description: 'matter',
                  subCategories: [],
                },
                {
                  id: 5,
                  name: 'anti material',
                  description: 'nonmatter',
                  subCategories: [],
                },
              ],
            },
            {
              id: 4,
              name: 'anti light',
              description: 'dark',
              subCategories: [],
            },
          ],
        },
      ],
    },
  ]
  for (const testcase of categoryTransformTests) {
    it('categoriesQryRespToEntities should: ' + testcase.name, () => {
      expect(
        service.categoriesQryRespToEntities(testcase.categoryRows),
      ).toStrictEqual(testcase.expectRes)
    })
  }
})
