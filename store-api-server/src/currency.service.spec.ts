import { Test, TestingModule } from '@nestjs/testing';
import { CurrencyService } from 'src/currency.service';
import {
  mockedRatesProvider,
  mockedBadRatesProvider,
} from 'src/mock/rates.provider';
import { BASE_CURRENCY } from 'src/constants';

describe('CurrencyService with a "working" rates provider', () => {
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

  const testcases = [
    {
      inp: 0,
      exp: '0.00',
    },
    {
      inp: 1,
      exp: '0.01',
    },
    {
      inp: 10,
      exp: '0.10',
    },
    {
      inp: 76,
      exp: '0.76',
    },
    {
      inp: 534,
      exp: '5.34',
    },
    {
      inp: 53400,
      exp: '534.00',
    },
  ];

  for (const tc of testcases) {
    it(`convertToCurrency converts the baseUnit to decimal (${tc.inp} => ${tc.exp})`, () => {
      const got = service.convertToCurrency(tc.inp, BASE_CURRENCY);
      expect(got).toEqual(tc.exp);
    });
  }

  const testcases2 = [
    {
      inp: 0,
      exp: '0',
    },
    {
      inp: 1,
      exp: '1',
    },
    {
      inp: 10,
      exp: '10',
    },
    {
      inp: 76,
      exp: '76',
    },
    {
      inp: 534,
      exp: '534',
    },
    {
      inp: 53400,
      exp: '53400',
    },
  ];

  for (const tc of testcases2) {
    it(`convertToCurrency allows for disabling converting to decimal (${tc.inp} => ${tc.exp})`, () => {
      const got = service.convertToCurrency(tc.inp, BASE_CURRENCY, true);
      expect(got).toEqual(tc.exp);
    });
  }

  const testcases3 = [
    {
      inp: 0,
      exp: 0,
    },
    {
      inp: 0.01,
      exp: 1,
    },
    {
      inp: 0.1,
      exp: 10,
    },
    {
      inp: 0.76,
      exp: 76,
    },
    {
      inp: 5.34,
      exp: 534,
    },
    {
      inp: 534.0,
      exp: 53400,
    },
  ];

  for (const tc of testcases3) {
    it(`convertFromCurrency converts decimals back to base unit (${tc.inp} => ${tc.exp})`, () => {
      const got = service.convertFromCurrency(tc.inp, BASE_CURRENCY);
      expect(got).toEqual(tc.exp);
    });
  }

  const testcases4 = [
    {
      inp: 0,
      exp: '0.00',
    },
    {
      inp: 1,
      exp: '0.01',
    },
    {
      inp: 10,
      exp: '0.05',
    },
    {
      inp: 76,
      exp: '0.38',
    },
    {
      inp: 534,
      exp: '2.67',
    },
    {
      inp: 53400,
      exp: '267.00',
    },
  ];

  for (const tc of testcases4) {
    it(`convertToCurrency converts baseUnit EUR to decimal USD (${tc.inp} => ${tc.exp})`, () => {
      const got = service.convertToCurrency(tc.inp, 'USD');
      expect(got).toEqual(tc.exp);
    });
  }

  const testcases5 = [
    {
      inp: 0,
      exp: 0,
    },
    {
      inp: 0.01,
      exp: 2,
    },
    {
      inp: 0.05,
      exp: 10,
    },
    {
      inp: 0.38,
      exp: 76,
    },
    {
      inp: 2.67,
      exp: 534,
    },
    {
      inp: 267.0,
      exp: 53400,
    },
  ];

  for (const tc of testcases5) {
    it(`convertFromCurrency converts decimal USD to baseunit EUR (${tc.inp} => ${tc.exp})`, () => {
      const got = service.convertFromCurrency(tc.inp, 'USD');
      expect(got).toEqual(tc.exp);
    });
  }

  const testcases6 = [
    {
      inp: 0,
      exp: '0.00000', // XTZ has 5 decimals
    },
    {
      inp: 1,
      exp: '0.02000',
    },
    {
      inp: 10,
      exp: '0.20000',
    },
    {
      inp: 76,
      exp: '1.52000',
    },
    {
      inp: 534,
      exp: '10.68000',
    },
    {
      inp: 53400,
      exp: '1068.00000',
    },
  ];

  for (const tc of testcases6) {
    it(`convertToCurrency converts baseUnit EUR to decimal XTZ (${tc.inp} => ${tc.exp})`, () => {
      const got = service.convertToCurrency(tc.inp, 'XTZ');
      expect(got).toEqual(tc.exp);
    });
  }

  const testcases7 = [
    {
      inp: 0,
      exp: 0,
    },
    {
      inp: 0.02,
      exp: 1,
    },
    {
      inp: 0.2,
      exp: 10,
    },
    {
      inp: 1.52,
      exp: 76,
    },
    {
      inp: 10.68,
      exp: 534,
    },
    {
      inp: 1068,
      exp: 53400,
    },
  ];

  for (const tc of testcases7) {
    it(`convertToCurrency converts decimal XTZ to baseUnit EUR (${tc.inp} => ${tc.exp})`, () => {
      const got = service.convertFromCurrency(tc.inp, 'XTZ');
      expect(got).toEqual(tc.exp);
    });
  }
});

describe('CurrencyService with a "faulty" rates provider', () => {
  let service: CurrencyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [],
      providers: [mockedBadRatesProvider, CurrencyService],
    }).compile();

    service = module.get<CurrencyService>(CurrencyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it(`convertToCurrency should still be able to convert baseUnit ${BASE_CURRENCY} to decimal ${BASE_CURRENCY}`, () => {
    const got = service.convertToCurrency(345, BASE_CURRENCY);
    expect(got).toEqual('3.45');
  });

  it(`convertFromCurrency should still be able to convert decimal ${BASE_CURRENCY} to baseUnit ${BASE_CURRENCY}`, () => {
    const got = service.convertFromCurrency(3.45, BASE_CURRENCY);
    expect(got).toEqual(345);
  });

  it('convertToCurrency should err on too old rates when trying to convert between currencies (never updated at all)', () => {
    expect(() => service.convertToCurrency(345, 'XTZ')).toThrow();
  });

  it('convertFromCurrency should err on too old rates when trying to convert between currencies (never updated at all)', () => {
    expect(() => service.convertFromCurrency(345, 'XTZ')).toThrow();
  });
});
