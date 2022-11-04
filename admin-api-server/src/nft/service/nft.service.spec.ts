import { Test, TestingModule } from '@nestjs/testing';
import { NftService } from './nft.service';
import { S3Service } from './s3.service';
import { DbMockModule } from '../../db_mock.module';
import { RoleService } from '../../role/service/role.service';
import { CategoryService } from '../../category/service/category.service';
import { sleep } from '../../utils/utils';

describe('NftService', () => {
  let service: NftService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DbMockModule],
      providers: [NftService, S3Service, RoleService, CategoryService],
    }).compile();

    service = module.get<NftService>(NftService);
  });
  afterEach(async () => {
    service.beforeApplicationShutdown();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  test('nft locking: relock', async () => {
    let res = await service.withNftLock(0, async () => {
      return 'ok';
    });
    expect(res).toEqual('ok');

    // rerunning with same key should work (not halt due to eg missed unlock above)
    res = await service.withNftLock(0, async () => {
      return 'ok';
    });
    expect(res).toEqual('ok');
  });

  test('nft lock: lock _really_ locks', async () => {
    let res;
    await Promise.all([
      service.withNftLock(0, async () => {
        // sleeping for half a sec, if the lock works below will wait for this
        // to finish and execute last, if the lock doesn't work below will not
        // wait and then this entry will execute last and fail the test
        await sleep(500);
        res = 'entry A finished last';
      }),
      (async () => {
        // delayed entry of withNftLock to make sure above grabs the lock first
        await sleep(50);
        return service.withNftLock(0, async () => {
          res = 'entry B finished last';
        });
      })(),
    ]);
    expect(res).toEqual('entry B finished last');
  });

  test('nft lock: lock of 1 nft does not affect lock of another', async () => {
    let res;
    await Promise.all([
      service.withNftLock(0, async () => {
        // sleeping for half a sec, if the lock is applied below will wait for this
        // to finish and execute last, if the lock is not applied below will not
        // wait and then this entry will execute last and succeed the test
        await sleep(500);
        res = 'entry A finished last';
      }),
      (async () => {
        // delayed entry of withNftLock to make sure above grabs its lock first
        await sleep(50);
        return service.withNftLock(1, async () => {
          res = 'entry B finished last';
        });
      })(),
    ]);
    expect(res).toEqual('entry A finished last');
  });

  test('nft lock: if err is thrown, lock is still unlocked', async () => {
    let err;
    try {
      await service.withNftLock(0, async () => {
        throw 'err';
      });
    } catch (e: any) {
      err = e;
    }
    expect(err).toEqual('err');

    const res = await service.withNftLock(0, async () => {
      return 'ok';
    });
    expect(res).toEqual('ok');
  });
});
