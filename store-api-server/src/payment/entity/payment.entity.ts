import type { NftEntity } from '../../nft/entity/nft.entity.js';

export interface PaymentIntent {
  amount: string;
  currency: string;
  clientSecret: string;
  id: string;
  receiverAddress?: string;
  nfts?: NftEntity[];
  expiresAt?: number;
  other?: any;
}

export enum PaymentProvider {
  TEZPAY = 'tezpay',
  STRIPE = 'stripe',
  WERT = 'wert',
  TEST = 'test_provider',
}
