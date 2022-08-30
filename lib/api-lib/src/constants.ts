// key is the currency ticker, value is the number of decimals
export const SUPPORTED_CURRENCIES: { [key: string]: number } = {
  USD: 2,
  GBP: 2,
  EUR: 2,
  XTZ: 6,
};
export const BASE_CURRENCY: string = process.env['BASE_CURRENCY'] || 'EUR';
export const LOG_CURRENCY_RATES_UPDATES: boolean = (process.env['LOG_CURRENCY_RATES_UPDATES'] || 'enable') === 'enable';

export const SIGNATURE_PREFIX_CREATE_NFT = '00';
export const SIGNATURE_PREFIX_DELIST_NFT = '01';
export const SIGNATURE_PREFIX_RELIST_NFT = '02';

// set to 0 to disable enforcing a max age of the rates
export const DEFAULT_MAX_RATE_AGE_MINUTES: number = Number(process.env['DEFAULT_MAX_RATE_AGE_MINUTES'] || 30)
