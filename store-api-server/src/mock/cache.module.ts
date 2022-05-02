import { Module, CACHE_MANAGER } from '@nestjs/common';

const cacheMockProvider = {
  provide: CACHE_MANAGER,
  useFactory: () => undefined, //jest.fn(),
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
