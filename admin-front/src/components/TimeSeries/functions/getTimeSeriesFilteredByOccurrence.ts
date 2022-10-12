import moment from 'moment/moment';
import { Month } from '../types';
import { TimeSeriesRecord } from '../hooks/useGetTimeSeriesData';

interface GetTimeSeriesFiltered {
  timeSeries: TimeSeriesRecord[];
  occurrence?: Month;
}

const getMonthIdFromTimeStamp = (timestamp: number): number => {
  return Number(moment.unix(timestamp).format('MM'));
};

export const getTimeSeriesFilteredByOccurrence = ({
  timeSeries,
  occurrence,
}: GetTimeSeriesFiltered): TimeSeriesRecord[] => {
  if (!occurrence) {
    return timeSeries;
  }

  const newTimeSeries = [...timeSeries];

  switch (occurrence) {
    case 'January':
      return newTimeSeries.filter(
        (record) => getMonthIdFromTimeStamp(record.timestamp) === 1,
      );
    case 'February':
      return newTimeSeries.filter(
        (record) => getMonthIdFromTimeStamp(record.timestamp) === 2,
      );
    case 'March':
      return newTimeSeries.filter(
        (record) => getMonthIdFromTimeStamp(record.timestamp) === 3,
      );
    case 'April':
      return newTimeSeries.filter(
        (record) => getMonthIdFromTimeStamp(record.timestamp) === 4,
      );
    case 'May':
      return newTimeSeries.filter(
        (record) => getMonthIdFromTimeStamp(record.timestamp) === 5,
      );
    case 'June':
      return newTimeSeries.filter(
        (record) => getMonthIdFromTimeStamp(record.timestamp) === 6,
      );
    case 'July':
      return newTimeSeries.filter(
        (record) => getMonthIdFromTimeStamp(record.timestamp) === 7,
      );
    case 'August':
      return newTimeSeries.filter(
        (record) => getMonthIdFromTimeStamp(record.timestamp) === 8,
      );
    case 'September':
      return newTimeSeries.filter(
        (record) => getMonthIdFromTimeStamp(record.timestamp) === 9,
      );
    case 'October':
      return newTimeSeries.filter(
        (record) => getMonthIdFromTimeStamp(record.timestamp) === 10,
      );
    case 'November':
      return newTimeSeries.filter(
        (record) => getMonthIdFromTimeStamp(record.timestamp) === 11,
      );
    case 'December':
      return newTimeSeries.filter(
        (record) => getMonthIdFromTimeStamp(record.timestamp) === 12,
      );
    default:
      return timeSeries;
  }
};
