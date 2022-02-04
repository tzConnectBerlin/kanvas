import { Test, TestingModule } from '@nestjs/testing';
import { NftService } from './nft.service';
import { S3Service } from './s3.service';
import { DbMockModule } from 'src/db_mock.module';
import { RoleService } from 'src/role/service/role.service';
import { CategoryService } from 'src/category/service/category.service';

describe('NftService', () => {
  let service: NftService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DbMockModule],
      providers: [NftService, S3Service, RoleService, CategoryService],
    }).compile();

    service = module.get<NftService>(NftService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
