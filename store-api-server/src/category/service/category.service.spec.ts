import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from './category.service';
import { DbMock } from '../../mock/db.module';
import { CacheMock } from '../../mock/cache.module';

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
          metadata: null,
          parent: undefined,
        },
        {
          id: 2,
          category: 'light',
          description: 'bright',
          metadata: null,
          parent: undefined,
        },
      ],
      expectRes: [
        {
          id: 1,
          name: 'dust',
          description: '...',
          metadata: null,
          children: [],
        },
        {
          id: 2,
          name: 'light',
          description: 'bright',
          metadata: null,
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
          metadata: null,
          parent: 1,
        },
        {
          id: 1,
          category: 'dust',
          description: '...',
          metadata: null,
          parent: undefined,
        },
      ],
      expectRes: [
        {
          id: 1,
          name: 'dust',
          description: '...',
          metadata: null,
          children: [
            {
              id: 2,
              name: 'light',
              description: 'bright',
              metadata: null,
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
          metadata: null,
          parent: 2,
        },
        {
          id: 2,
          category: 'light',
          description: 'bright',
          metadata: null,
          parent: 1,
        },
        {
          id: 1,
          category: 'dust',
          description: '...',
          metadata: null,
          parent: undefined,
        },
      ],
      expectRes: [
        {
          id: 1,
          name: 'dust',
          description: '...',
          metadata: null,
          children: [
            {
              id: 2,
              name: 'light',
              description: 'bright',
              metadata: null,
              children: [
                {
                  id: 3,
                  name: 'material',
                  description: 'matter',
                  metadata: null,
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
          metadata: null,
          parent: 2,
        },
        {
          id: 5,
          category: 'anti material',
          description: 'nonmatter',
          metadata: null,
          parent: 2,
        },
        {
          id: 2,
          category: 'light',
          description: 'bright',
          metadata: null,
          parent: 1,
        },
        {
          id: 4,
          category: 'anti light',
          description: 'dark',
          metadata: null,
          parent: 1,
        },
        {
          id: 1,
          category: 'dust',
          description: '...',
          metadata: null,
          parent: undefined,
        },
      ],
      expectRes: [
        {
          id: 1,
          name: 'dust',
          description: '...',
          metadata: null,
          children: [
            {
              id: 2,
              name: 'light',
              description: 'bright',
              metadata: null,
              children: [
                {
                  id: 3,
                  name: 'material',
                  description: 'matter',
                  metadata: null,
                  children: [],
                },
                {
                  id: 5,
                  name: 'anti material',
                  description: 'nonmatter',
                  metadata: null,
                  children: [],
                },
              ],
            },
            {
              id: 4,
              name: 'anti light',
              description: 'dark',
              metadata: null,
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
