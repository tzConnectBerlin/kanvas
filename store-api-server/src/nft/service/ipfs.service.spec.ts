import { Test, TestingModule } from '@nestjs/testing';
import { DbMock } from '../../mock/db.module';
import { NftEntity } from '../entity/nft.entity';
import { NftIpfsService } from '../../nft/service/ipfs.service';
import { IpfsPinMock } from '../../mock/ipfs_pin.module';
import { MINTER_ADDRESS } from '../../constants';

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
        formats: {
          artifact: {
            mimeType: 'video/mp4',
          },
          display: {
            mimeType: 'image/jpeg',
          },
          thumbnail: {
            mimeType: 'image/png',
          },
        },
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
        isProxy: false,
      },
      exp: {
        artifactUri: 'ipfs-mock://artifact',
        displayUri: 'ipfs-mock://display',
        thumbnailUri: 'ipfs-mock://thumbnail',
        contributors: [],
        date: '1970-01-01T00:00:00.000Z',
        decimals: 0,
        description: 'descr',
        formats: [
          {
            uri: 'ipfs-mock://artifact',
            mimeType: 'video/mp4',
          },
          {
            uri: 'ipfs-mock://display',
            mimeType: 'image/jpeg',
          },
          {
            uri: 'ipfs-mock://thumbnail',
            mimeType: 'image/png',
          },
          {
            uri: 'ipfs://testing',
            mimeType: 'application/pdf',
          },
        ],
        isBooleanAmount: true,
        minter: process.env['MINTER_TZ_ADDRESS'],
        name: 'test',
        publishers: ['Tezos'],
        signature: 'not signed',
        rightUri: 'ipfs://testing',
        rightsUri: 'ipfs://testing',
        tags: [],
      },
    },
    {
      name: 'name and description get copied over',
      nft: {
        artifactUri: 'artifact.mp4',
        displayUri: 'display.jpeg',
        thumbnailUri: 'thumbnail.png',
        formats: {
          artifact: {
            mimeType: 'video/mp4',
          },
          display: {
            mimeType: 'image/jpeg',
          },
          thumbnail: {
            mimeType: 'image/png',
          },
        },
        createdAt: 0,
        name: 'A Test',
        description:
          'a test NFT with a different name and description than in other tests',
        editionsSize: 1,
        categories: [],

        id: 1,
        price: '15.30',
        isProxy: false,
        launchAt: 0,
        editionsAvailable: 0,
        editionsSold: 0,
      },
      exp: {
        artifactUri: 'ipfs-mock://artifact',
        displayUri: 'ipfs-mock://display',
        thumbnailUri: 'ipfs-mock://thumbnail',
        contributors: [],
        date: '1970-01-01T00:00:00.000Z',
        decimals: 0,
        description:
          'a test NFT with a different name and description than in other tests',
        formats: [
          {
            uri: 'ipfs-mock://artifact',
            mimeType: 'video/mp4',
          },
          {
            uri: 'ipfs-mock://display',
            mimeType: 'image/jpeg',
          },
          {
            uri: 'ipfs-mock://thumbnail',
            mimeType: 'image/png',
          },
          {
            uri: 'ipfs://testing',
            mimeType: 'application/pdf',
          },
        ],
        isBooleanAmount: true,
        minter: process.env['MINTER_TZ_ADDRESS'],
        name: 'A Test',
        publishers: ['Tezos'],
        signature: 'not signed',
        rightUri: 'ipfs://testing',
        rightsUri: 'ipfs://testing',
        tags: [],
      },
    },
    {
      name: 'content uri with unknown/weird extension => excluded from formats array',
      nft: {
        artifactUri: 'artifact.someExtensionThatIsNotRecognized',
        displayUri: 'display.jpeg',
        thumbnailUri: 'thumbnail.png',
        formats: {
          display: {
            mimeType: 'image/jpeg',
          },
          thumbnail: {
            mimeType: 'image/png',
          },
        },
        createdAt: 0,
        name: 'test',
        description: 'descr',
        editionsSize: 1,
        categories: [],

        id: 1,
        price: '15.30',
        isProxy: false,
        launchAt: 0,
        editionsAvailable: 0,
        editionsSold: 0,
      },
      exp: {
        artifactUri: 'ipfs-mock://artifact',
        displayUri: 'ipfs-mock://display',
        thumbnailUri: 'ipfs-mock://thumbnail',
        contributors: [],
        date: '1970-01-01T00:00:00.000Z',
        decimals: 0,
        description: 'descr',
        formats: [
          {
            uri: 'ipfs-mock://display',
            mimeType: 'image/jpeg',
          },
          {
            uri: 'ipfs-mock://thumbnail',
            mimeType: 'image/png',
          },
          {
            uri: 'ipfs://testing',
            mimeType: 'application/pdf',
          },
        ],
        isBooleanAmount: true,
        minter: process.env['MINTER_TZ_ADDRESS'],
        name: 'test',
        publishers: ['Tezos'],
        signature: 'not signed',
        rightUri: 'ipfs://testing',
        rightsUri: 'ipfs://testing',
        tags: [],
      },
    },
    {
      name: 'categories translate to "tags" field',
      nft: {
        artifactUri: 'artifact.mp4',
        displayUri: 'display.jpeg',
        thumbnailUri: 'thumbnail.jpg',
        formats: {
          artifact: {
            mimeType: 'video/mp4',
          },
          display: {
            mimeType: 'image/jpeg',
          },
          thumbnail: {
            mimeType: 'image/jpeg',
          },
        },
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
        isProxy: false,
        launchAt: 0,
        editionsAvailable: 0,
        editionsSold: 0,
      },
      exp: {
        artifactUri: 'ipfs-mock://artifact',
        displayUri: 'ipfs-mock://display',
        thumbnailUri: 'ipfs-mock://thumbnail',
        contributors: [],
        date: '1970-01-01T00:00:00.000Z',
        decimals: 0,
        description: 'descr',
        formats: [
          {
            uri: 'ipfs-mock://artifact',
            mimeType: 'video/mp4',
          },
          {
            uri: 'ipfs-mock://display',
            mimeType: 'image/jpeg',
          },
          {
            uri: 'ipfs-mock://thumbnail',
            mimeType: 'image/jpeg',
          },
          {
            uri: 'ipfs://testing',
            mimeType: 'application/pdf',
          },
        ],
        isBooleanAmount: true,
        minter: process.env['MINTER_TZ_ADDRESS'],
        name: 'test',
        publishers: ['Tezos'],
        signature: 'not signed',
        rightUri: 'ipfs://testing',
        rightsUri: 'ipfs://testing',
        tags: ['Some collection', 'Another collection'],
      },
    },
    {
      name: 'more than 1 editionsSize => isBooleanAmount becomes false',
      nft: {
        artifactUri: 'artifact.mp4',
        displayUri: 'display.jpeg',
        thumbnailUri: 'thumbnail.jpg',
        formats: {
          artifact: {
            mimeType: 'video/mp4',
          },
          display: {
            mimeType: 'image/jpeg',
          },
          thumbnail: {
            mimeType: 'image/jpeg',
          },
        },
        createdAt: 0,
        name: 'test',
        description: 'descr',
        editionsSize: 2,
        categories: [],

        id: 1,
        price: '15.30',
        isProxy: false,
        launchAt: 0,
        editionsAvailable: 0,
        editionsSold: 0,
      },
      exp: {
        artifactUri: 'ipfs-mock://artifact',
        displayUri: 'ipfs-mock://display',
        thumbnailUri: 'ipfs-mock://thumbnail',
        contributors: [],
        date: '1970-01-01T00:00:00.000Z',
        decimals: 0,
        description: 'descr',
        formats: [
          {
            uri: 'ipfs-mock://artifact',
            mimeType: 'video/mp4',
          },
          {
            uri: 'ipfs-mock://display',
            mimeType: 'image/jpeg',
          },
          {
            uri: 'ipfs-mock://thumbnail',
            mimeType: 'image/jpeg',
          },
          {
            uri: 'ipfs://testing',
            mimeType: 'application/pdf',
          },
        ],
        isBooleanAmount: false,
        minter: process.env['MINTER_TZ_ADDRESS'],
        name: 'test',
        publishers: ['Tezos'],
        signature: 'not signed',
        rightUri: 'ipfs://testing',
        rightsUri: 'ipfs://testing',
        tags: [],
      },
    },
    {
      name: 'more than 1 editionsSize => isBooleanAmount becomes false (another test w/ editionsSize bigger than 2)',
      nft: {
        artifactUri: 'artifact.mp4',
        displayUri: 'display.jpeg',
        thumbnailUri: 'thumbnail.jpg',
        formats: {
          artifact: {
            mimeType: 'video/mp4',
          },
          display: {
            mimeType: 'image/jpeg',
          },
          thumbnail: {
            mimeType: 'image/jpeg',
          },
        },
        createdAt: 0,
        name: 'test',
        description: 'descr',
        editionsSize: 105,
        categories: [],

        id: 1,
        price: '15.30',
        isProxy: false,
        launchAt: 0,
        editionsAvailable: 0,
        editionsSold: 0,
      },
      exp: {
        artifactUri: 'ipfs-mock://artifact',
        displayUri: 'ipfs-mock://display',
        thumbnailUri: 'ipfs-mock://thumbnail',
        contributors: [],
        date: '1970-01-01T00:00:00.000Z',
        decimals: 0,
        description: 'descr',
        formats: [
          {
            uri: 'ipfs-mock://artifact',
            mimeType: 'video/mp4',
          },
          {
            uri: 'ipfs-mock://display',
            mimeType: 'image/jpeg',
          },
          {
            uri: 'ipfs-mock://thumbnail',
            mimeType: 'image/jpeg',
          },
          {
            uri: 'ipfs://testing',
            mimeType: 'application/pdf',
          },
        ],
        isBooleanAmount: false,
        minter: process.env['MINTER_TZ_ADDRESS'],
        name: 'test',
        publishers: ['Tezos'],
        signature: 'not signed',
        rightUri: 'ipfs://testing',
        rightsUri: 'ipfs://testing',
        tags: [],
      },
    },
    {
      name: 'createdAt translates from UNIX epoch seconds to ISO formatted "date" field',
      nft: {
        artifactUri: 'artifact.mp4',
        displayUri: 'display.jpeg',
        thumbnailUri: 'thumbnail.jpg',
        formats: {
          artifact: {
            mimeType: 'video/mp4',
          },
          display: {
            mimeType: 'image/jpeg',
          },
          thumbnail: {
            mimeType: 'image/jpeg',
          },
        },
        createdAt: 1663236430,
        name: 'test',
        description: 'descr',
        editionsSize: 1,
        categories: [],

        id: 1,
        price: '15.30',
        isProxy: false,
        launchAt: 0,
        editionsAvailable: 0,
        editionsSold: 0,
      },
      exp: {
        artifactUri: 'ipfs-mock://artifact',
        displayUri: 'ipfs-mock://display',
        thumbnailUri: 'ipfs-mock://thumbnail',
        contributors: [],
        date: '2022-09-15T10:07:10.000Z',

        decimals: 0,
        description: 'descr',
        formats: [
          {
            uri: 'ipfs-mock://artifact',
            mimeType: 'video/mp4',
          },
          {
            uri: 'ipfs-mock://display',
            mimeType: 'image/jpeg',
          },
          {
            uri: 'ipfs-mock://thumbnail',
            mimeType: 'image/jpeg',
          },
          {
            uri: 'ipfs://testing',
            mimeType: 'application/pdf',
          },
        ],
        isBooleanAmount: true,
        minter: process.env['MINTER_TZ_ADDRESS'],
        name: 'test',
        publishers: ['Tezos'],
        signature: 'not signed',
        rightUri: 'ipfs://testing',
        rightsUri: 'ipfs://testing',
        tags: [],
      },
    },
    {
      name: 'undefined display and thumbnail => we default pointing their ipfs to the artifact asset',
      nft: {
        artifactUri: 'artifact.jpeg',
        formats: {
          artifact: {
            mimeType: 'image/jpeg',
          },
        },
        createdAt: 0,
        name: 'test',
        description: 'descr',
        editionsSize: 1,
        categories: [],

        id: 1,
        price: '15.30',
        isProxy: false,
        launchAt: 0,
        editionsAvailable: 0,
        editionsSold: 0,
      },
      exp: {
        artifactUri: 'ipfs-mock://artifact',
        displayUri: 'ipfs-mock://artifact',
        thumbnailUri: 'ipfs-mock://artifact',
        contributors: [],
        date: '1970-01-01T00:00:00.000Z',
        decimals: 0,
        description: 'descr',
        formats: [
          {
            uri: 'ipfs-mock://artifact',
            mimeType: 'image/jpeg',
          },
          {
            uri: 'ipfs://testing',
            mimeType: 'application/pdf',
          },
        ],
        isBooleanAmount: true,
        minter: process.env['MINTER_TZ_ADDRESS'],
        name: 'test',
        publishers: ['Tezos'],
        signature: 'not signed',
        rightUri: 'ipfs://testing',
        rightsUri: 'ipfs://testing',
        tags: [],
      },
    },
    {
      name: 'undefined thumbnail => we default pointing its ipfs to the thumbnail asset',
      nft: {
        artifactUri: 'artifact.jpeg',
        displayUri: 'display.jpeg',
        formats: {
          artifact: {
            mimeType: 'image/jpeg',
          },
          display: {
            mimeType: 'image/jpeg',
          },
        },
        createdAt: 0,
        name: 'test',
        description: 'descr',
        editionsSize: 1,
        categories: [],

        id: 1,
        price: '15.30',
        isProxy: false,
        launchAt: 0,
        editionsAvailable: 0,
        editionsSold: 0,
      },
      exp: {
        artifactUri: 'ipfs-mock://artifact',
        displayUri: 'ipfs-mock://display',
        thumbnailUri: 'ipfs-mock://display',
        contributors: [],
        date: '1970-01-01T00:00:00.000Z',
        decimals: 0,
        description: 'descr',
        formats: [
          {
            uri: 'ipfs-mock://artifact',
            mimeType: 'image/jpeg',
          },
          {
            uri: 'ipfs-mock://display',
            mimeType: 'image/jpeg',
          },
          {
            uri: 'ipfs://testing',
            mimeType: 'application/pdf',
          },
        ],
        isBooleanAmount: true,
        minter: process.env['MINTER_TZ_ADDRESS'],
        name: 'test',
        publishers: ['Tezos'],
        signature: 'not signed',
        rightUri: 'ipfs://testing',
        rightsUri: 'ipfs://testing',
        tags: [],
      },
    },
    {
      name: 'defined but same displayUri/thumbnailUri as artifactUri => doesnt result in duplicated formats fields',
      nft: {
        artifactUri: 'artifact.jpeg',
        displayUri: 'artifact.jpeg',
        thumbnailUri: 'artifact.jpeg',
        formats: {
          artifact: {
            mimeType: 'image/jpeg',
          },
          display: {
            mimeType: 'image/jpeg',
          },
          thumbnail: {
            mimeType: 'image/jpeg',
          },
        },
        createdAt: 0,
        name: 'test',
        description: 'descr',
        editionsSize: 1,
        categories: [],

        id: 1,
        price: '15.30',
        isProxy: false,
        launchAt: 0,
        editionsAvailable: 0,
        editionsSold: 0,
      },
      exp: {
        artifactUri: 'ipfs-mock://artifact',
        displayUri: 'ipfs-mock://artifact',
        thumbnailUri: 'ipfs-mock://artifact',
        contributors: [],
        date: '1970-01-01T00:00:00.000Z',
        decimals: 0,
        description: 'descr',
        formats: [
          {
            uri: 'ipfs-mock://artifact',
            mimeType: 'image/jpeg',
          },
          {
            uri: 'ipfs://testing',
            mimeType: 'application/pdf',
          },
        ],
        isBooleanAmount: true,
        minter: process.env['MINTER_TZ_ADDRESS'],
        name: 'test',
        publishers: ['Tezos'],
        signature: 'not signed',
        rightUri: 'ipfs://testing',
        rightsUri: 'ipfs://testing',
        tags: [],
      },
    },
    {
      name: 'defined but same thumbnailUri as displayUri => doesnt result in duplicated formats fields',
      nft: {
        artifactUri: 'artifact.jpeg',
        displayUri: 'display.jpeg',
        thumbnailUri: 'display.jpeg',
        formats: {
          artifact: {
            mimeType: 'image/jpeg',
          },
          display: {
            mimeType: 'image/jpeg',
          },
          thumbnail: {
            mimeType: 'image/jpeg',
          },
        },
        createdAt: 0,
        name: 'test',
        description: 'descr',
        editionsSize: 1,
        categories: [],

        id: 1,
        price: '15.30',
        isProxy: false,
        launchAt: 0,
        editionsAvailable: 0,
        editionsSold: 0,
      },
      exp: {
        artifactUri: 'ipfs-mock://artifact',
        displayUri: 'ipfs-mock://display',
        thumbnailUri: 'ipfs-mock://display',
        contributors: [],
        date: '1970-01-01T00:00:00.000Z',
        decimals: 0,
        description: 'descr',
        formats: [
          {
            uri: 'ipfs-mock://artifact',
            mimeType: 'image/jpeg',
          },
          {
            uri: 'ipfs-mock://display',
            mimeType: 'image/jpeg',
          },
          {
            uri: 'ipfs://testing',
            mimeType: 'application/pdf',
          },
        ],
        isBooleanAmount: true,
        minter: process.env['MINTER_TZ_ADDRESS'],
        name: 'test',
        publishers: ['Tezos'],
        signature: 'not signed',
        rightUri: 'ipfs://testing',
        rightsUri: 'ipfs://testing',
        tags: [],
      },
    },
    {
      name: 'defined but same thumbnailUri content as displayUri content => doesnt result in duplicated formats fields',
      nft: {
        artifactUri: 'artifact.jpeg',
        displayUri: 'display.jpeg',
        thumbnailUri: 'display#test-dup-content#.jpeg',
        formats: {
          artifact: {
            mimeType: 'image/jpeg',
          },
          display: {
            mimeType: 'image/jpeg',
          },
          thumbnail: {
            mimeType: 'image/jpeg',
          },
        },
        createdAt: 0,
        name: 'test',
        description: 'descr',
        editionsSize: 1,
        categories: [],

        id: 1,
        price: '15.30',
        isProxy: false,
        launchAt: 0,
        editionsAvailable: 0,
        editionsSold: 0,
      },
      exp: {
        artifactUri: 'ipfs-mock://artifact',
        displayUri: 'ipfs-mock://display',
        thumbnailUri: 'ipfs-mock://display',
        contributors: [],
        date: '1970-01-01T00:00:00.000Z',
        decimals: 0,
        description: 'descr',
        formats: [
          {
            uri: 'ipfs-mock://artifact',
            mimeType: 'image/jpeg',
          },
          {
            uri: 'ipfs-mock://display',
            mimeType: 'image/jpeg',
          },
          {
            uri: 'ipfs://testing',
            mimeType: 'application/pdf',
          },
        ],
        isBooleanAmount: true,
        minter: process.env['MINTER_TZ_ADDRESS'],
        name: 'test',
        publishers: ['Tezos'],
        signature: 'not signed',
        rightUri: 'ipfs://testing',
        rightsUri: 'ipfs://testing',
        tags: [],
      },
    },
    {
      name: 'defined but same thumbnailUri content as artifactUri content => doesnt result in duplicated formats fields',
      nft: {
        artifactUri: 'artifact.jpeg',
        displayUri: 'display.jpeg',
        thumbnailUri: 'artifact#test-dup-content#.jpeg',
        formats: {
          artifact: {
            mimeType: 'image/jpeg',
          },
          display: {
            mimeType: 'image/jpeg',
          },
          thumbnail: {
            mimeType: 'image/jpeg',
          },
        },
        createdAt: 0,
        name: 'test',
        description: 'descr',
        editionsSize: 1,
        categories: [],

        id: 1,
        price: '15.30',
        isProxy: false,
        launchAt: 0,
        editionsAvailable: 0,
        editionsSold: 0,
      },
      exp: {
        artifactUri: 'ipfs-mock://artifact',
        displayUri: 'ipfs-mock://display',
        thumbnailUri: 'ipfs-mock://artifact',
        contributors: [],
        date: '1970-01-01T00:00:00.000Z',
        decimals: 0,
        description: 'descr',
        formats: [
          {
            uri: 'ipfs-mock://artifact',
            mimeType: 'image/jpeg',
          },
          {
            uri: 'ipfs-mock://display',
            mimeType: 'image/jpeg',
          },
          {
            uri: 'ipfs://testing',
            mimeType: 'application/pdf',
          },
        ],
        isBooleanAmount: true,
        minter: process.env['MINTER_TZ_ADDRESS'],
        name: 'test',
        publishers: ['Tezos'],
        signature: 'not signed',
        rightUri: 'ipfs://testing',
        rightsUri: 'ipfs://testing',
        tags: [],
      },
    },
    {
      name: 'defined but same displayUri content as artifactUri content => doesnt result in duplicated formats fields',
      nft: {
        artifactUri: 'artifact.jpeg',
        displayUri: 'artifact#test-dup-content#.jpeg',
        thumbnailUri: 'thumbnail.jpeg',
        formats: {
          artifact: {
            mimeType: 'image/jpeg',
          },
          display: {
            mimeType: 'image/jpeg',
          },
          thumbnail: {
            mimeType: 'image/jpeg',
          },
        },
        createdAt: 0,
        name: 'test',
        description: 'descr',
        editionsSize: 1,
        categories: [],

        id: 1,
        price: '15.30',
        isProxy: false,
        launchAt: 0,
        editionsAvailable: 0,
        editionsSold: 0,
      },
      exp: {
        artifactUri: 'ipfs-mock://artifact',
        displayUri: 'ipfs-mock://artifact',
        thumbnailUri: 'ipfs-mock://thumbnail',
        contributors: [],
        date: '1970-01-01T00:00:00.000Z',
        decimals: 0,
        description: 'descr',
        formats: [
          {
            uri: 'ipfs-mock://artifact',
            mimeType: 'image/jpeg',
          },
          {
            uri: 'ipfs-mock://thumbnail',
            mimeType: 'image/jpeg',
          },
          {
            uri: 'ipfs://testing',
            mimeType: 'application/pdf',
          },
        ],
        isBooleanAmount: true,
        minter: process.env['MINTER_TZ_ADDRESS'],
        name: 'test',
        publishers: ['Tezos'],
        signature: 'not signed',
        rightUri: 'ipfs://testing',
        rightsUri: 'ipfs://testing',
        tags: [],
      },
    },
    {
      name: 'defined but same displayUri content as artifactUri content and deceptively different file extensions => doesnt result in duplicated formats fields and artifactUri extension is picked',
      nft: {
        artifactUri: 'artifact.jpeg',
        displayUri: 'artifact#test-dup-content#.mp4',
        thumbnailUri: 'thumbnail.jpeg',
        formats: {
          artifact: {
            mimeType: 'image/jpeg',
          },
          display: {
            mimeType: 'video/mp4',
          },
          thumbnail: {
            mimeType: 'image/jpeg',
          },
        },
        createdAt: 0,
        name: 'test',
        description: 'descr',
        editionsSize: 1,
        categories: [],

        id: 1,
        price: '15.30',
        isProxy: false,
        launchAt: 0,
        editionsAvailable: 0,
        editionsSold: 0,
      },
      exp: {
        artifactUri: 'ipfs-mock://artifact',
        displayUri: 'ipfs-mock://artifact',
        thumbnailUri: 'ipfs-mock://thumbnail',
        contributors: [],
        date: '1970-01-01T00:00:00.000Z',
        decimals: 0,
        description: 'descr',
        formats: [
          {
            uri: 'ipfs-mock://artifact',
            mimeType: 'image/jpeg',
          },
          {
            uri: 'ipfs-mock://thumbnail',
            mimeType: 'image/jpeg',
          },
          {
            uri: 'ipfs://testing',
            mimeType: 'application/pdf',
          },
        ],
        isBooleanAmount: true,
        minter: process.env['MINTER_TZ_ADDRESS'],
        name: 'test',
        publishers: ['Tezos'],
        signature: 'not signed',
        rightUri: 'ipfs://testing',
        rightsUri: 'ipfs://testing',
        tags: [],
      },
    },
    {
      name: 'test with attributes inside the nft metadata',
      nft: {
        artifactUri: 'artifact.mp4',
        displayUri: 'display.jpeg',
        thumbnailUri: 'thumbnail.png',
        formats: {
          artifact: {
            mimeType: 'video/mp4',
          },
          display: {
            mimeType: 'image/jpeg',
          },
          thumbnail: {
            mimeType: 'image/png',
          },
        },
        createdAt: 0,
        name: 'test',
        description: 'descr',
        editionsSize: 1,
        categories: [],
        metadata: {
          attributes: [
            {
              name: 'hat color',
              value: 'blue',
            },
            {
              name: 'has shoes',
              value: true,
              type: 'flag', // note: probably not a sensible type example, but just to indicate that type does not have to be a purely type level description, putting here something different than boolean
              notCopiedOverField: 'bla',
            },
            {
              name: 'hats amount',
              value: 5,
              type: 'integer',
            },
          ],
        },

        id: 1,
        price: '15.30',
        launchAt: 0,
        editionsAvailable: 0,
        editionsSold: 0,
        isProxy: false,
      },
      exp: {
        artifactUri: 'ipfs-mock://artifact',
        displayUri: 'ipfs-mock://display',
        thumbnailUri: 'ipfs-mock://thumbnail',
        contributors: [],
        date: '1970-01-01T00:00:00.000Z',
        decimals: 0,
        description: 'descr',
        formats: [
          {
            uri: 'ipfs-mock://artifact',
            mimeType: 'video/mp4',
          },
          {
            uri: 'ipfs-mock://display',
            mimeType: 'image/jpeg',
          },
          {
            uri: 'ipfs-mock://thumbnail',
            mimeType: 'image/png',
          },
          {
            uri: 'ipfs://testing',
            mimeType: 'application/pdf',
          },
        ],
        isBooleanAmount: true,
        minter: process.env['MINTER_TZ_ADDRESS'],
        name: 'test',
        publishers: ['Tezos'],
        signature: 'not signed',
        rightUri: 'ipfs://testing',
        rightsUri: 'ipfs://testing',
        tags: [],
        attributes: [
          {
            name: 'hat color',
            value: 'blue',
          },
          {
            name: 'has shoes',
            value: true,
            type: 'flag',
          },
          {
            name: 'hats amount',
            value: 5,
            type: 'integer',
          },
        ],
      },
    },
  ];
  for (const tc of testcases) {
    it(tc.name, async () => {
      tc.exp.royalties = {
        decimals: 2,
        shares: {},
      };
      tc.exp.creators = [MINTER_ADDRESS];
      tc.exp.royalties.shares[`${MINTER_ADDRESS}`] = 10;
      tc.exp.id = tc.nft.id;

      const got = await service.nftMetadataJson(tc.nft, 'not signed');
      expect(got).toStrictEqual(tc.exp);
    });
  }
});
