export const mockedRatesProvider = {
  provide: 'RATES GETTER',
  useValue: mockRatesFunc,
};

async function mockRatesFunc(
  currencies: string,
): Promise<{ [key: string]: number }> {
  const res: { [key: string]: number } = {};
  for (const curr of currencies) {
    res[curr] = 1;
  }
  return res;
}
