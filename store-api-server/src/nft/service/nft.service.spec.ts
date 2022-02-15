import { Test, TestingModule } from '@nestjs/testing';
import { NftService } from './nft.service';
import { CategoryService } from 'src/category/service/category.service';
import { DbMockModule } from 'src/db_mock.module';

describe('NftService', () => {
  let service: NftService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DbMockModule],
      providers: [NftService, CategoryService],
    }).compile();

    service = module.get<NftService>(NftService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
