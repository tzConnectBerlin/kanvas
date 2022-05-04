import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from '../service/analytics.service';
import { DbMockModule } from 'src/db_mock.module';
import { mockedRatesProvider, CurrencyService } from 'kanvas-api-lib';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DbMockModule],
      controllers: [AnalyticsController],
      providers: [AnalyticsService, mockedRatesProvider, CurrencyService],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
