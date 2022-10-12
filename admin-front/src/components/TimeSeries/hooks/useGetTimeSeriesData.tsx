import { useEffect, useState } from 'react';
import moment from 'moment';
import useGetDataFromAPI from 'shared/hooks/useGetDataFromAPI';
import { getTimeSeriesFilteredByOccurrence } from '../functions/getTimeSeriesFilteredByOccurrence';
import { Month, Resolution } from '../types';

export interface TimeSeriesRecord {
  timestamp: number;
  value: number;
}

interface TimeSeriesData {
  timeStamps: string[];
  timeStampValues: number[];
}

const TimeSeriesPaths = {
  nftCount: '/analytics/sales/nftCount/timeseries',
  priceVolume: '/analytics/sales/priceVolume/timeseries',
};

export type TimeSeriesType = 'nftCount' | 'priceVolume';

interface UseGetTimeSeriesDataProps {
  timeSeriesType: TimeSeriesType;
  resolution: Resolution;
  occurrence?: Month;
}

const UseGetTimeSeriesData = ({
  timeSeriesType,
  resolution,
  occurrence,
}: UseGetTimeSeriesDataProps): TimeSeriesData => {
  const queryStr = resolution ? `?resolution=${resolution}` : undefined;
  const { data: fetchedTimeSeries } = useGetDataFromAPI<TimeSeriesRecord[]>({
    path: TimeSeriesPaths[timeSeriesType],
    queryStr,
  });
  const [timeStamps, setTimeStamps] = useState<string[]>([]);
  const [timeStampValues, setTimeStampValues] = useState<number[]>([]);

  useEffect(() => {
    if (fetchedTimeSeries) {
      const timeSeriesFilteredByOccurrence = getTimeSeriesFilteredByOccurrence({
        timeSeries: fetchedTimeSeries,
        occurrence,
      });

      setTimeStamps(
        timeSeriesFilteredByOccurrence.map((record: TimeSeriesRecord) => {
          return moment.unix(record.timestamp).format('MM/DD/YYYY');
        }),
      );

      setTimeStampValues(
        timeSeriesFilteredByOccurrence.map(
          (record: TimeSeriesRecord) => record.value,
        ),
      );
    }
  }, [fetchedTimeSeries, occurrence]);

  return {
    timeStamps,
    timeStampValues,
  };
};

export default UseGetTimeSeriesData;
