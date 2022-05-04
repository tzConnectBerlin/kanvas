import { Module, CACHE_MANAGER } from '@nestjs/common';
import { jest } from '@jest/globals';

const cacheMockProvider = {
  provide: CACHE_MANAGER,
  useFactory: () => jest.fn(),
};

@Module({
  providers: [cacheMockProvider],
  exports: [cacheMockProvider],
})
export class CacheMock {
  wrap(k: string, worker: any): any {
    return worker();
  }
}
