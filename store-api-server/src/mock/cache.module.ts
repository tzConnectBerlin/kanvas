import { Module, CACHE_MANAGER } from '@nestjs/common';

const cacheMockProvider = {
  provide: CACHE_MANAGER,
  useFactory: jest.fn(),
};

@Module({
  providers: [cacheMockProvider],
  exports: [cacheMockProvider],
})
export class CacheMock {}
