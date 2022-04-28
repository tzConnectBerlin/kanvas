// key is the currency ticker, value is the number of decimals
export const SUPPORTED_CURRENCIES: { [key: string]: number } = {
  USD: 2,
  GBP: 2,
  EUR: 2,
  XTZ: 5,
};
export const BASE_CURRENCY: string = process.env['BASE_CURRENCY'] || 'EUR';
