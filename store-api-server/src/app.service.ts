import { Injectable, Inject } from '@nestjs/common';
import { CART_MAX_ITEMS, KANVAS_CONTRACT, TEZOS_NETWORK } from './constants.js';
import { BASE_CURRENCY, SUPPORTED_CURRENCIES } from 'kanvas-api-lib';
import { AppConstants } from './app.entity.js';
import { TOKEN_GATE } from './constants.js';

import { TokenGate } from 'token-gate';

const appConstants: AppConstants = {
  cartMaxItems: CART_MAX_ITEMS,

  supportedCurrencies: Object.keys(SUPPORTED_CURRENCIES),
  baseCurrency: BASE_CURRENCY,

  tezosNetwork: TEZOS_NETWORK,
  kanvasContract: KANVAS_CONTRACT,
};

@Injectable()
export class AppService {
  constructor(@Inject(TOKEN_GATE) private tokenGate: TokenGate) {}

  getConstants(): AppConstants {
    const tokenGateSpec = this.tokenGate.getSpec();
    return {
      ...appConstants,
      tokenGated: Object.keys(tokenGateSpec).length > 0 ? true : undefined,
    };
  }
}
