import { Test, TestingModule } from '@nestjs/testing';
import { CurrencyService } from 'src/currency.service';
import { mockedRatesProvider } from 'src/mock/rates.provider';

describe('CurrencyService', () => {
  let service: CurrencyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [],
      providers: [mockedRatesProvider, CurrencyService],
    }).compile();

    service = module.get<CurrencyService>(CurrencyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
