import { CART_MAX_ITEMS, KANVAS_CONTRACT, TEZOS_NETWORK } from './constants.js';
import { BASE_CURRENCY, SUPPORTED_CURRENCIES } from 'kanvas-api-lib';
import { AppConstants } from './app.entity.js';

const appConstants: AppConstants = {
  cartMaxItems: CART_MAX_ITEMS,

  supportedCurrencies: Object.keys(SUPPORTED_CURRENCIES),
  baseCurrency: BASE_CURRENCY,

  tezosNetwork: TEZOS_NETWORK,
  kanvasContract: KANVAS_CONTRACT,
};

export class AppService {
  getConstants(): AppConstants {
    return appConstants;
  }
}
