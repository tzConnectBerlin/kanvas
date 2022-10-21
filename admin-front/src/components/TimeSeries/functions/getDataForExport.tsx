import { TimeSeriesRecord, TimeSeriesType } from '../utility';
import moment from 'moment';

interface SeriesArrays {
  priceVolume: TimeSeriesRecord[];
  nftCount: TimeSeriesRecord[];
}

interface ExportParam {
  timeseries: TimeSeriesRecord[];
  context: TimeSeriesType;
}

type GetDataForExport = Array<ExportParam>;

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
        .format('DD/MM/YY hh:mm a');
      record[exportKeyNames.value] = record['value'];
      delete record['timestamp'];
      delete record['value'];

      return record;
    });

    seriesArrays[context] = contextArray;
  });

  const longestLength = Math.max(
    ...Object.values(seriesArrays).map((sArr) => sArr.length),
  );

  let exportArray: Array<Record<string, number>> = [];

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

  return exportArray;
};
