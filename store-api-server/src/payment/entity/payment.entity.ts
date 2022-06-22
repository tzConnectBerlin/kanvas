import type { NftEntity } from '../../nft/entity/nft.entity.js';

export interface NftOrder {
  nfts: NftEntity[];
  expiresAt: number;
  // the key of paymentIntents below is PaymentProvider
  paymentIntents: { [key: string]: PaymentIntent };
}

export interface StripeDetails {
  clientSecret: string;
}
export interface WertDetails {
  wertData: any;
}
export interface TezpayDetails {
  receiverAddress: string;
  paypointMessage: string;
  mutezAmount: number;
}

export interface PaymentIntent {
  id: string;

  amount: string;
  currency: string;
  paymentDetails?: StripeDetails | WertDetails | TezpayDetails;

  nfts: NftEntity[];
  expiresAt: number;
}

export enum PaymentProvider {
  TEZPAY = 'tezpay',
  STRIPE = 'stripe',
  WERT = 'wert',
  TEST = 'test_provider',
}

export type PaymentProviderString = `${PaymentProvider}`;
