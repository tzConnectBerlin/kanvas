export enum ResolutionValues {
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}
export type Resolution =
  | ResolutionValues.HOUR
  | ResolutionValues.DAY
  | ResolutionValues.WEEK
  | ResolutionValues.MONTH;

export type Month =
  | 'All'
  | 'January'
  | 'February'
  | 'March'
  | 'April'
  | 'May'
  | 'June'
  | 'July'
  | 'August'
  | 'September'
  | 'October'
  | 'November'
  | 'December';

export interface TimeSeriesRecord {
  timestamp: number;
  value: number;
}

export interface Occurrence {
  year: number;
  month: Month;
}

export enum TimeSeriesTypeEnum {
  NFT_COUNT = 'nftCount',
  PRICE_VOLUME = 'priceVolume',
}

export type TimeSeriesType =
  | TimeSeriesTypeEnum.NFT_COUNT
  | TimeSeriesTypeEnum.PRICE_VOLUME;
