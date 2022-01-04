import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from '../service/user.service';
import { NftService } from 'src/nft/service/nft.service';
import { MintService } from 'src/nft/service/mint.service';
import { IpfsService } from 'src/nft/service/ipfs.service';
import { S3Service } from 'src/s3.service';
import { DbMockModule } from 'src/db_mock.module';
import { expectErrWithHttpStatus } from 'src/utils';

describe('UserController', () => {
  let controller: UserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DbMockModule],
      controllers: [UserController],
      providers: [UserService, NftService, MintService, IpfsService, S3Service],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
