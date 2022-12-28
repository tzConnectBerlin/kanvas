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
  clientSecret?: string;
  checkoutSessionUrl?: string;
  id: string;
}
export interface WertDetails {
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

  currency: string;
  // Don't use following toplevel amount fields for finalizing payment forms in
  // the client! If an amount must be passed to the relevant payment provider's
  // form, then the relevant amount field will be present in the
  // paymentDetails object that is in the correct format for the provider.
  //
  // Why: the toplevel amount field here is only for display purposes, and may
  // or may not be in the right format for finalizing payment forms (some
  // providers expect the amount to be in base unit (ie cents in case of fiat
  // currencies), some expect it to be in decimal unit (ie euros in case of
  // EUR, etc.))
  amount: string;

  amountExclVat: string;
  vatRate: number;

  provider: PaymentProviderString;
  providerPaymentDetails?:
    | StripeDetails
    | WertDetails
    | TezpayDetails
    | SimplexDetails;

  // deprecated, use providerPaymentDetails instead
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
