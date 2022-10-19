import { TimeSeriesRecord, TimeSeriesType } from '../utility';
import moment from 'moment';

interface SeriesArrays {
  priceVolume: TimeSeriesRecord[];
  nftCount: TimeSeriesRecord[];
}

interface ExportParamObj {
  timeseries: TimeSeriesRecord[];
  context: TimeSeriesType;
}

type GetDataForExport = Array<ExportParamObj>;

export const getDataForExport = (data: GetDataForExport) => {
  const seriesArrays: SeriesArrays = { priceVolume: [], nftCount: [] };

  data.forEach((exportObj) => {
    const { context } = exportObj;

    const exportKeyNames = {
      timestamp: `${context}Date`,
      value: `${context}Value`,
    };

    const contextArray = exportObj.timeseries.map((record: any) => {
      record[exportKeyNames.timestamp] = moment
        .unix(record['timestamp'])
        .format('DD/MM/YY HH:MM');
      record[exportKeyNames.value] = record['value'];
      delete record['timestamp'];
      delete record['value'];

      return record;
    });

    seriesArrays[context] = contextArray;
  });

  let longestLength = 0;

  for (let key in seriesArrays) {
    if (seriesArrays.hasOwnProperty(key)) {
      const lengthOfCurrentArray =
        seriesArrays[key as keyof SeriesArrays].length;
      if (lengthOfCurrentArray > longestLength) {
        longestLength = lengthOfCurrentArray;
      }
    }
  }

  let exportArray: Array<Record<string, number>> = [];

  if (longestLength > 0) {
    for (let i = 0; i < longestLength; i++) {
      for (let key in seriesArrays) {
        if (seriesArrays.hasOwnProperty(key)) {
          const currentArray = seriesArrays[key as keyof SeriesArrays];
          if (currentArray[i] !== undefined) {
            exportArray[i] = {
              ...exportArray[i],
              ...currentArray[i],
            };
          }
        }
      }
    }
  }

  return exportArray;
};
