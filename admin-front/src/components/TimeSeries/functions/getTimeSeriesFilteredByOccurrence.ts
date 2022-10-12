import moment from 'moment/moment';
import { TimeSeriesRecord } from '../hooks/useGetTimeSeriesData';
import { Month } from '../types';

interface GetTimeSeriesFiltered {
  timeSeries: TimeSeriesRecord[];
  occurrence: Occurrence;
}

export interface Occurrence {
  year: number;
  month: Month;
}

const MonthToIdMap = {
  All: 0,
  January: 1,
  February: 2,
  March: 3,
  April: 4,
  May: 5,
  June: 6,
  July: 7,
  August: 8,
  September: 9,
  October: 10,
  November: 11,
  December: 12,
};

const getMonthIdFromTimeStamp = (timestamp: number): number => {
  return Number(moment.unix(timestamp).format('MM'));
};

const getYearFromTimeStamp = (timestamp: number) => {
  return Number(moment.unix(timestamp).format('YYYY'));
};

export const getTimeSeriesFilteredByOccurrence = ({
  timeSeries,
  occurrence,
}: GetTimeSeriesFiltered): TimeSeriesRecord[] => {
  const newTimeSeries = [...timeSeries];

  let timeSeriesFilteredByYear = newTimeSeries.filter((record) => {
    return getYearFromTimeStamp(record.timestamp) === occurrence.year;
  });

  if (occurrence.month === 'All') {
    return timeSeriesFilteredByYear;
  } else {
    const timeSeriesFilteredByYearAndMonth = timeSeriesFilteredByYear.filter(
      (record) =>
        getMonthIdFromTimeStamp(record.timestamp) ===
        MonthToIdMap[occurrence.month],
    );
    return timeSeriesFilteredByYearAndMonth;
  }
};
