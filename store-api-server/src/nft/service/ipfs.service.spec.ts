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

  const testcases: { name: string; nft: NftEntity; exp: any }[] = [
    {
      name: 'undefined display and thumbnail => we default pointing their ipfs to artifact asset',
      nft: {
        artifactUri: 'artifact.jpeg',
        createdAt: 0,
        name: 'test',
        description: 'descr',
        editionsSize: 1,
        categories: [],

        id: 1,
        price: '15.30',
        launchAt: 0,
        editionsAvailable: 0,
        editionsSold: 0,
      },
      exp: {
        artifactUri: 'ipfs-mock://artifact.jpeg',
        displayUri: 'ipfs-mock://artifact.jpeg',
        thumbnailUri: 'ipfs-mock://artifact.jpeg',
        contributors: [],
        creators: [],
        date: '1970-01-01T00:00:00.000Z',
        decimals: 0,
        description: 'descr',
        formats: [
          {
            uri: 'ipfs-mock://artifact.jpeg',
            mimeType: 'image/jpeg',
          },
        ],
        isBooleanAmount: true,
        minter: 'tz1Qgrh4svmkGmF7acZQ91xpNh7ZNfaGndyx',
        name: 'test',
        publishers: ['Tezos'],
        signature: 'not signed',
        tags: [],
      },
    },
  ];
  for (const tc of testcases) {
    it(tc.name, async () => {
      const got = await service.nftMetadataJson(tc.nft, 'not signed');
      expect(got).toEqual(tc.exp);
    });
  }
});
