import { Test, TestingModule } from '@nestjs/testing';
import { DbMock } from '../../mock/db.module';
import { NftEntity } from '../entity/nft.entity';
import { NftIpfsService } from '../../nft/service/ipfs.service';
import { IpfsPinMock } from '../../mock/ipfs_pin.module';

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
      name: 'simple test',
      nft: {
        artifactUri: 'artifact.mp4',
        displayUri: 'display.jpeg',
        thumbnailUri: 'thumbnail.png',
        createdAt: 0,
        name: 'test',
        description: 'descr',
        editionsSize: 1,
        categories: [],

        // following fields dont impact output but must be defined (and same for other tests defined below)
        id: 1,
        price: '15.30',
        launchAt: 0,
        editionsAvailable: 0,
        editionsSold: 0,
      },
      exp: {
        artifactUri: 'ipfs-mock://artifact.mp4',
        displayUri: 'ipfs-mock://display.jpeg',
        thumbnailUri: 'ipfs-mock://thumbnail.png',
        contributors: [],
        creators: [],
        date: '1970-01-01T00:00:00.000Z',
        decimals: 0,
        description: 'descr',
        formats: [
          {
            uri: 'ipfs-mock://artifact.mp4',
            mimeType: 'video/mp4',
          },
          {
            uri: 'ipfs-mock://display.jpeg',
            mimeType: 'image/jpeg',
          },
          {
            uri: 'ipfs-mock://thumbnail.png',
            mimeType: 'image/png',
          },
        ],
        isBooleanAmount: true,
        minter: process.env['MINTER_TZ_ADDRESS'],
        name: 'test',
        publishers: ['Tezos'],
        signature: 'not signed',
        tags: [],
      },
    },
    {
      name: 'name and description get copied over',
      nft: {
        artifactUri: 'artifact.mp4',
        displayUri: 'display.jpeg',
        thumbnailUri: 'thumbnail.png',
        createdAt: 0,
        name: 'A Test',
        description:
          'a test NFT with a different name and description than in other tests',
        editionsSize: 1,
        categories: [],

        id: 1,
        price: '15.30',
        launchAt: 0,
        editionsAvailable: 0,
        editionsSold: 0,
      },
      exp: {
        artifactUri: 'ipfs-mock://artifact.mp4',
        displayUri: 'ipfs-mock://display.jpeg',
        thumbnailUri: 'ipfs-mock://thumbnail.png',
        contributors: [],
        creators: [],
        date: '1970-01-01T00:00:00.000Z',
        decimals: 0,
        description:
          'a test NFT with a different name and description than in other tests',
        formats: [
          {
            uri: 'ipfs-mock://artifact.mp4',
            mimeType: 'video/mp4',
          },
          {
            uri: 'ipfs-mock://display.jpeg',
            mimeType: 'image/jpeg',
          },
          {
            uri: 'ipfs-mock://thumbnail.png',
            mimeType: 'image/png',
          },
        ],
        isBooleanAmount: true,
        minter: process.env['MINTER_TZ_ADDRESS'],
        name: 'A Test',
        publishers: ['Tezos'],
        signature: 'not signed',
        tags: [],
      },
    },
    {
      name: 'content uri with unknown/weird extension => excluded from formats array',
      nft: {
        artifactUri: 'artifact.someExtensionThatIsNotRecognized',
        displayUri: 'display.jpeg',
        thumbnailUri: 'thumbnail.png',
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
        artifactUri: 'ipfs-mock://artifact.someExtensionThatIsNotRecognized',
        displayUri: 'ipfs-mock://display.jpeg',
        thumbnailUri: 'ipfs-mock://thumbnail.png',
        contributors: [],
        creators: [],
        date: '1970-01-01T00:00:00.000Z',
        decimals: 0,
        description: 'descr',
        formats: [
          {
            uri: 'ipfs-mock://display.jpeg',
            mimeType: 'image/jpeg',
          },
          {
            uri: 'ipfs-mock://thumbnail.png',
            mimeType: 'image/png',
          },
        ],
        isBooleanAmount: true,
        minter: process.env['MINTER_TZ_ADDRESS'],
        name: 'test',
        publishers: ['Tezos'],
        signature: 'not signed',
        tags: [],
      },
    },
    {
      name: 'categories translate to "tags" field',
      nft: {
        artifactUri: 'artifact.mp4',
        displayUri: 'display.jpeg',
        thumbnailUri: 'thumbnail.jpg',
        createdAt: 0,
        name: 'test',
        description: 'descr',
        editionsSize: 1,
        categories: [
          {
            name: 'Some collection',

            id: 0,
            description: 'A collection of NFTs about something',
          },
          {
            name: 'Another collection',

            id: 0,
            description: 'Another collection of NFTs about something',
          },
        ],

        id: 1,
        price: '15.30',
        launchAt: 0,
        editionsAvailable: 0,
        editionsSold: 0,
      },
      exp: {
        artifactUri: 'ipfs-mock://artifact.mp4',
        displayUri: 'ipfs-mock://display.jpeg',
        thumbnailUri: 'ipfs-mock://thumbnail.jpg',
        contributors: [],
        creators: [],
        date: '1970-01-01T00:00:00.000Z',
        decimals: 0,
        description: 'descr',
        formats: [
          {
            uri: 'ipfs-mock://artifact.mp4',
            mimeType: 'video/mp4',
          },
          {
            uri: 'ipfs-mock://display.jpeg',
            mimeType: 'image/jpeg',
          },
          {
            uri: 'ipfs-mock://thumbnail.jpg',
            mimeType: 'image/jpeg',
          },
        ],
        isBooleanAmount: true,
        minter: process.env['MINTER_TZ_ADDRESS'],
        name: 'test',
        publishers: ['Tezos'],
        signature: 'not signed',
        tags: ['Some collection', 'Another collection'],
      },
    },
    {
      name: 'more than 1 editionsSize => isBooleanAmount becomes false',
      nft: {
        artifactUri: 'artifact.mp4',
        displayUri: 'display.jpeg',
        thumbnailUri: 'thumbnail.jpg',
        createdAt: 0,
        name: 'test',
        description: 'descr',
        editionsSize: 2,
        categories: [],

        id: 1,
        price: '15.30',
        launchAt: 0,
        editionsAvailable: 0,
        editionsSold: 0,
      },
      exp: {
        artifactUri: 'ipfs-mock://artifact.mp4',
        displayUri: 'ipfs-mock://display.jpeg',
        thumbnailUri: 'ipfs-mock://thumbnail.jpg',
        contributors: [],
        creators: [],
        date: '1970-01-01T00:00:00.000Z',
        decimals: 0,
        description: 'descr',
        formats: [
          {
            uri: 'ipfs-mock://artifact.mp4',
            mimeType: 'video/mp4',
          },
          {
            uri: 'ipfs-mock://display.jpeg',
            mimeType: 'image/jpeg',
          },
          {
            uri: 'ipfs-mock://thumbnail.jpg',
            mimeType: 'image/jpeg',
          },
        ],
        isBooleanAmount: false,
        minter: process.env['MINTER_TZ_ADDRESS'],
        name: 'test',
        publishers: ['Tezos'],
        signature: 'not signed',
        tags: [],
      },
    },
    {
      name: 'more than 1 editionsSize => isBooleanAmount becomes false (another test w/ editionsSize bigger than 2)',
      nft: {
        artifactUri: 'artifact.mp4',
        displayUri: 'display.jpeg',
        thumbnailUri: 'thumbnail.jpg',
        createdAt: 0,
        name: 'test',
        description: 'descr',
        editionsSize: 105,
        categories: [],

        id: 1,
        price: '15.30',
        launchAt: 0,
        editionsAvailable: 0,
        editionsSold: 0,
      },
      exp: {
        artifactUri: 'ipfs-mock://artifact.mp4',
        displayUri: 'ipfs-mock://display.jpeg',
        thumbnailUri: 'ipfs-mock://thumbnail.jpg',
        contributors: [],
        creators: [],
        date: '1970-01-01T00:00:00.000Z',
        decimals: 0,
        description: 'descr',
        formats: [
          {
            uri: 'ipfs-mock://artifact.mp4',
            mimeType: 'video/mp4',
          },
          {
            uri: 'ipfs-mock://display.jpeg',
            mimeType: 'image/jpeg',
          },
          {
            uri: 'ipfs-mock://thumbnail.jpg',
            mimeType: 'image/jpeg',
          },
        ],
        isBooleanAmount: false,
        minter: process.env['MINTER_TZ_ADDRESS'],
        name: 'test',
        publishers: ['Tezos'],
        signature: 'not signed',
        tags: [],
      },
    },
    {
      name: 'createdAt translates from UNIX epoch seconds to ISO formatted "date" field',
      nft: {
        artifactUri: 'artifact.mp4',
        displayUri: 'display.jpeg',
        thumbnailUri: 'thumbnail.jpg',
        createdAt: 1663236430,
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
        artifactUri: 'ipfs-mock://artifact.mp4',
        displayUri: 'ipfs-mock://display.jpeg',
        thumbnailUri: 'ipfs-mock://thumbnail.jpg',
        contributors: [],
        creators: [],
        date: '2022-09-15T10:07:10.000Z',

        decimals: 0,
        description: 'descr',
        formats: [
          {
            uri: 'ipfs-mock://artifact.mp4',
            mimeType: 'video/mp4',
          },
          {
            uri: 'ipfs-mock://display.jpeg',
            mimeType: 'image/jpeg',
          },
          {
            uri: 'ipfs-mock://thumbnail.jpg',
            mimeType: 'image/jpeg',
          },
        ],
        isBooleanAmount: true,
        minter: process.env['MINTER_TZ_ADDRESS'],
        name: 'test',
        publishers: ['Tezos'],
        signature: 'not signed',
        tags: [],
      },
    },
    {
      name: 'undefined display and thumbnail => we default pointing their ipfs to the artifact asset',
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
        minter: process.env['MINTER_TZ_ADDRESS'],
        name: 'test',
        publishers: ['Tezos'],
        signature: 'not signed',
        tags: [],
      },
    },
    {
      name: 'undefined thumbnail => we default pointing its ipfs to the thumbnail asset',
      nft: {
        artifactUri: 'artifact.jpeg',
        displayUri: 'display.jpeg',
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
        displayUri: 'ipfs-mock://display.jpeg',
        thumbnailUri: 'ipfs-mock://display.jpeg',
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
          {
            uri: 'ipfs-mock://display.jpeg',
            mimeType: 'image/jpeg',
          },
        ],
        isBooleanAmount: true,
        minter: process.env['MINTER_TZ_ADDRESS'],
        name: 'test',
        publishers: ['Tezos'],
        signature: 'not signed',
        tags: [],
      },
    },
    {
      name: 'defined but same displayUri/thumbnailUri as artifactUri => doesnt result in duplicated formats fields',
      nft: {
        artifactUri: 'artifact.jpeg',
        displayUri: 'artifact.jpeg',
        thumbnailUri: 'artifact.jpeg',
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
        minter: process.env['MINTER_TZ_ADDRESS'],
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
