import { useEffect, useState } from 'react';
import moment from 'moment';
import useGetDataFromAPI from 'shared/hooks/useGetDataFromAPI';

interface TimeSeriesRecord {
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

type TimeSeriesType = 'nftCount' | 'priceVolume';

const UseGetTimeSeriesData = (
  timeSeriesType: TimeSeriesType,
): TimeSeriesData => {
  const { data: fetchedTimeSeries } = useGetDataFromAPI<TimeSeriesRecord[]>(
    TimeSeriesPaths[timeSeriesType],
  );
  const [timeStamps, setTimeStamps] = useState<string[]>([]);
  const [timeStampValues, setTimeStampValues] = useState<number[]>([]);

  useEffect(() => {
    if (fetchedTimeSeries) {
      setTimeStamps(
        fetchedTimeSeries.map((record: TimeSeriesRecord) => {
          return moment.unix(record.timestamp).format('MM/DD/YYYY');
        }),
      );

      setTimeStampValues(
        fetchedTimeSeries.map((record: TimeSeriesRecord) => record.value),
      );
    }
  }, [fetchedTimeSeries]);

  return {
    timeStamps,
    timeStampValues,
  };
};

export default UseGetTimeSeriesData;
