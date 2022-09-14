import { Test, TestingModule } from '@nestjs/testing';
import { DbMock } from '../../mock/db.module';
import { NftEntity } from '../entity/nft.entity.js';
import { NftIpfsService } from '../../nft/service/ipfs.service';
import { IpfsPinMock } from '../../mock/ipfs_pin.module.js';

describe('NftService', () => {
  let service: NftIpfsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DbMock, IpfsPinMock],
      providers: [NftIpfsService],
    }).compile();

    service = module.get<NftIpfsService>(NftIpfsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  /*
  it('', () => {
    const testcases: { nft: NftEntity; exp: any }[] = [
      {
        nft: {
          id: 1,
          createdAt: 0,
          name: 'test',
          description: 'descr',
          price: '15.30',
          categories: [],
          launchAt: 0,

          editionsSize: 1,
          editionsAvailable: 1,
          editionsSold: 0,

          artifactUri: 'artifact.jpeg',
        },
        exp: {},
      },
    ];
    for (const tc of testcases) {
      const got = service.nftMetadataJson(tc.nft, '');
      console.log(got);
      expect(got).toEqual(tc.exp);
    }
  });
  */
});
