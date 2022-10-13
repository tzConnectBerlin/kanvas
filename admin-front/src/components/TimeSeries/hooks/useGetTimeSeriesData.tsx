import { useEffect, useState } from 'react';
import moment from 'moment';
import useGetDataFromAPI from 'shared/hooks/useGetDataFromAPI';
import { getTimeSeriesFilteredByOccurrence, getDateFormat } from '../functions';
import {
  Month,
  Resolution,
  TimeSeries,
  TimeSeriesRecord,
  TimeSeriesType,
} from '../utility';

interface TimeSeriesData {
  timeStamps: string[];
  timeStampValues: number[];
  fetchedTimeSeries?: TimeSeries;
}

const TimeSeriesPaths = {
  nftCount: '/analytics/sales/nftCount/timeseries',
  priceVolume: '/analytics/sales/priceVolume/timeseries',
};

interface UseGetTimeSeriesDataProps {
  timeSeriesType: TimeSeriesType;
  resolution: Resolution;
  year: number;
  month: Month;
}

const UseGetTimeSeriesData = ({
  timeSeriesType,
  resolution,
  year,
  month,
}: UseGetTimeSeriesDataProps): TimeSeriesData => {
  const [timeStamps, setTimeStamps] = useState<string[]>([]);
  const [timeStampValues, setTimeStampValues] = useState<number[]>([]);

  const queryStr = resolution ? `?resolution=${resolution}` : undefined;
  const { data: fetchedTimeSeries } = useGetDataFromAPI<TimeSeriesRecord[]>({
    path: TimeSeriesPaths[timeSeriesType],
    queryStr,
  });

  useEffect(() => {
    if (fetchedTimeSeries) {
      const timeSeriesFilteredByOccurrence = getTimeSeriesFilteredByOccurrence({
        timeSeries: fetchedTimeSeries,
        occurrence: { year, month },
      });

      setTimeStamps(
        timeSeriesFilteredByOccurrence.map((record: TimeSeriesRecord) => {
          const dateFormat = getDateFormat({ resolution, month });
          return moment.unix(record.timestamp).format(dateFormat);
        }),
      );

      setTimeStampValues(
        timeSeriesFilteredByOccurrence.map(
          (record: TimeSeriesRecord) => record.value,
        ),
      );
    }
  }, [fetchedTimeSeries, year, month]);

  return {
    timeStamps,
    timeStampValues,
    fetchedTimeSeries,
  };
};

export default UseGetTimeSeriesData;
