import { Test, TestingModule } from '@nestjs/testing';
import { NftController } from './nft.controller';
import { NftService } from '../service/nft.service';
import { S3Service } from '../service/s3.service';
import { DbMockModule } from 'src/db_mock.module';
import { RoleService } from 'src/role/service/role.service';

describe('NftController', () => {
  let controller: NftController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DbMockModule],
      controllers: [NftController],
      providers: [NftService, S3Service, RoleService],
    }).compile();

    controller = module.get<NftController>(NftController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
