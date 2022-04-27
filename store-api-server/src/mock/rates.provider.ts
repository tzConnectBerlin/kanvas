export const mockedRatesProvider = {
  provide: 'RATES GETTER',
  useValue: mockRatesFunc,
};

export const mockedBadRatesProvider = {
  provide: 'RATES GETTER',
  useValue: mockBadRatesFunc,
};

async function mockRatesFunc(
  currencies: string,
): Promise<{ [key: string]: number }> {
  const res: { [key: string]: number } = {};
  for (const curr of currencies) {
    let rate: number;
    switch (curr) {
      case 'USD':
        rate = 0.5;
        break;
      case 'XTZ':
        rate = 2.0;
        break;
      default:
        rate = 1.0;
        break;
    }
    res[curr] = rate;
  }
  return res;
}

async function mockBadRatesFunc(
  currencies: string,
): Promise<{ [key: string]: number }> {
  throw 'err';
}
