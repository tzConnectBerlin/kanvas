export interface MetricParams {
  resolution: Resolution;
}

export interface MetricEntity {
  timestamp: number;
  value: number;
}

export enum Resolution {
  Hour = 'hour',
  Day = 'day',
  Week = 'week',
  Month = 'month',
  Infinite = 'infinite'
}
