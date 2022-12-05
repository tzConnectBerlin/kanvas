export interface MetricParams {
  resolution: Resolution;
}

export interface MetricEntity {
  timestamp: number;
  value: number;
}

export interface MarketingEntity {
  id: number;
  address: string;
  email?: string[];
  marketing_consent?: boolean;
  created_at: string;

  wallet_provider?: string;
  sso_id?: string;
  sso_type?: string;
  sso_email?: string;
}

export enum Resolution {
  Hour = 'hour',
  Day = 'day',
  Week = 'week',
  Month = 'month',
  Infinite = 'infinite',
}

export interface Activity {
  timestamp: number;
  kind: string;
  from: string;
  to: string;
  tokenId: number;
  price: string;
  edition_size: number;
  currency: string;
  transaction_value: string;
  conversion_rate: string;
  fee: number;
}

export interface Purchase {
  index: number;

  wallet_address: string;
  email?: string;
  marketing_consent?: boolean;
  age_verification?: boolean;

  token_collection: string;
  token_id: number;
  token_value: number; // base currency
  token_purchased_at: Date;

  transaction_currency: string;
  transaction_value: number;
  conversion_rate: number;

  vat_rate: number;
  purchaser_country: string;

  gas_fees: number;
}

export interface UserAnalytics {
  index: number;
  wallet_address: string;
  registered_at: Date;

  email?: string;
  marketing_consent?: boolean;
  age_verification?: boolean;

  has_purchases: boolean;
}
