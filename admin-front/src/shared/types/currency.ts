export enum CurrencySymbol {
  EUR = '€',
  USD = '$',
  XTZ = 'ꜩ',
  GBP = '£',
}

export enum Currency {
  EUR = 'EUR',
  USD = 'USD',
  XTZ = 'XTZ',
  GBP = 'GBP',
}

export interface CurrencySymbolData {
  symbol:
    | CurrencySymbol.EUR
    | CurrencySymbol.XTZ
    | CurrencySymbol.USD
    | CurrencySymbol.GBP;
  position: 'before' | 'after';
}

export type SupportedCurrency = 'EUR' | 'USD' | 'XTZ' | 'GBP' | '';
