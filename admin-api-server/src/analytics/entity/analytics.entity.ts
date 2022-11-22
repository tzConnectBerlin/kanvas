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
  consent: 'Yes' | 'No';
  createdAt: string;
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
  amount: number;
}
