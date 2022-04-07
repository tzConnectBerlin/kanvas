import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from './category.service';
import { DbMock } from 'src/mock/db.module';
import { CacheMock } from 'src/mock/cache.module';

describe('CategoryService', () => {
  let service: CategoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DbMock, CacheMock],
      providers: [CategoryService],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

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
          children: [],
        },
        {
          id: 2,
          name: 'light',
          description: 'bright',
          children: [],
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
          children: [
            {
              id: 2,
              name: 'light',
              description: 'bright',
              children: [],
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
          children: [
            {
              id: 2,
              name: 'light',
              description: 'bright',
              children: [
                {
                  id: 3,
                  name: 'material',
                  description: 'matter',
                  children: [],
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
          children: [
            {
              id: 2,
              name: 'light',
              description: 'bright',
              children: [
                {
                  id: 3,
                  name: 'material',
                  description: 'matter',
                  children: [],
                },
                {
                  id: 5,
                  name: 'anti material',
                  description: 'nonmatter',
                  children: [],
                },
              ],
            },
            {
              id: 4,
              name: 'anti light',
              description: 'dark',
              children: [],
            },
          ],
        },
      ],
    },
  ];
  for (const testcase of categoryTransformTests) {
    it('categoriesQryRespToEntities should: ' + testcase.name, () => {
      expect(
        service.categoriesQryRespToEntities(testcase.categoryRows),
      ).toStrictEqual(testcase.expectRes);
    });
  }
});
