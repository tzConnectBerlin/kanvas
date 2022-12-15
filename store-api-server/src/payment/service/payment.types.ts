import { UserEntity } from '../../user/entity/user.types.js';
import {
  PaymentIntent,
  PaymentProvider,
  PaymentProviderString,
} from '../entity/payment.entity.js';
import { DbTransaction } from '../../db.module';

export interface HandleCreatePaymentIntent {
  cookieSession: any;
  user: UserEntity;
  request: any;
  paymentProvider: PaymentProvider;
  currency: string;
  recreateNftOrder: boolean;
}

export interface ICreatePaymentIntent {
  user: UserEntity;
  provider: PaymentProviderString;
  currency: string;
  amountUnit: number;
  clientIp: string;
}

export interface ICreatePaymentDetails {
  user: UserEntity;
  paymentId: string;
  provider: PaymentProviderString;
  currency: string;
  amountUnit: number;
  clientIp: string;
}

export interface ICreateWertPaymentDetails {
  paymentId: string;
  userAddress: string;
  fiatCurrency: string;
  mutezAmount: number;
}

export interface ICreateSimplexPaymentDetails {
  user: UserEntity;
  fiatCurrency: string;
  amountUnit: number;
  clientIp: string;
}

export interface IRegisterPayment {
  dbTx: DbTransaction;
  nftOrderId: number;
  paymentIntent: PaymentIntentInternal;
}

export interface PaymentIntentInternal
  extends Omit<PaymentIntent, 'nfts' | 'expiresAt' | 'amountExclVat'> {
  clientIp: string;
  amountExclVat: number;
  externalPaymentId?: string;
  purchaserCountry: string;
}
