// key is the currency ticker, value is the number of decimals
export const SUPPORTED_CURRENCIES: { [key: string]: number } = {
  USD: 2,
  GBP: 2,
  EUR: 2,
  XTZ: 5,
};
export const BASE_CURRENCY: string = process.env['BASE_CURRENCY'] || 'EUR';
export const LOG_CURRENCY_RATES_UPDATES: boolean = (process.env['LOG_CURRENCY_RATES_UPDATES'] || 'enable') === 'enable';

export const SIGNATURE_PREFIX_CREATE_NFT = '00';
export const SIGNATURE_PREFIX_DELIST_NFT = '01';
export const SIGNATURE_PREFIX_RELIST_NFT = '02';
