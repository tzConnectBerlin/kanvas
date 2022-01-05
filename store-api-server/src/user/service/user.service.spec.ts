//require('dotenv').config();
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { NftService } from 'src/nft/service/nft.service';
import { MintService } from 'src/nft/service/mint.service';
import { CategoryService } from 'src/category/service/category.service';
import { IpfsService } from 'src/nft/service/ipfs.service';
import { S3Service } from 'src/s3.service';
import { DbMockModule } from 'src/db_mock.module';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DbMockModule],
      providers: [
        NftService,
        CategoryService,
        UserService,
        MintService,
        IpfsService,
        S3Service,
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
