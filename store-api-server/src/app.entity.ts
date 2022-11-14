export interface AppConstants {
  cartMaxItems: number;

  supportedCurrencies: string[];
  baseCurrency: string;

  tezosNetwork: string;
  kanvasContract: string;

  tokenGated?: boolean;
}
