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

  wallet_provider: string;
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
