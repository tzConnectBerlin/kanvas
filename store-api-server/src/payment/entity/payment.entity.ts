import type { NftEntity } from '../../nft/entity/nft.entity.js';

export enum OrderStatus {
  CANCELED = 'canceled',
  PENDING_PAYMENT = 'pending_payment',
  DELIVERING = 'delivering',
  DELIVERED = 'delivered',
}

export type OrderStatusString = `${OrderStatus}`;

export enum NftDeliveryStatus {
  UNKNOWN = 'unknown',
  INITIATING = 'initiating',
  DELIVERING = 'delivering',
  DELIVERED = 'delivered',
}

export type OrderStatusStringString = `${NftDeliveryStatus}`;

export interface NftDeliveryInfo {
  status: OrderStatusStringString;
  transferOpHash?: string;
  proxiedNft?: NftEntity;
}

export interface OrderInfo {
  orderedNfts: NftEntity[];

  orderStatus: OrderStatusString;
  paymentIntents: {
    paymentId: string;
    provider: PaymentProvider;
    status: PaymentStatusString;
  }[];

  delivery?: {
    [key: number /* nft id */]: NftDeliveryInfo;
  };
}

export enum PaymentStatus {
  CANCELED = 'canceled',
  TIMED_OUT = 'timedOut',
  FAILED = 'failed',
  CREATED = 'created',
  PROMISED = 'promised',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
}

export type PaymentStatusString = `${PaymentStatus}`;

export interface StripeDetails {
  amount: string;
  clientSecret: string;
}
export interface WertDetails {
  amount: string;
  wertData: any;
}

export interface SimplexDetails {
  simplexData: any;
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
  paymentDetails?: StripeDetails | WertDetails | TezpayDetails | SimplexDetails;

  nfts: NftEntity[];
  expiresAt: number;
}

export enum PaymentProvider {
  TEZPAY = 'tezpay',
  STRIPE = 'stripe',
  WERT = 'wert',
  SIMPLEX = 'simplex',
  TEST = 'test_provider',
}

export type PaymentProviderString = `${PaymentProvider}`;
