import { ChangeEvent, MouseEvent, useEffect, useRef, useState } from 'react';
import { ExportToCsv } from 'export-to-csv';
import { Grid, Paper, Button } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import 'chart.js/auto';
import moment from 'moment/moment';
import BarChartTimeSeries from './BarChartTimeSeries';
import { theme } from 'theme';
import { destroyReferenceAndClone } from 'utils/utils';
import {
  Month,
  Resolution,
  ResolutionValues,
  TimeSeriesTypeEnum,
} from './utility';
import { getDataForExport } from './functions';
import TimeSeriesFilter from './TimeSeriesFilter';
import useGetTimeSeriesData from './hooks/useGetTimeSeriesData';

const buttonStyles = {
  borderRadius: 100,
  color: theme.palette.primary.main,
  borderColor: 'rgb(196, 196, 196)',
  padding: '.5rem  1.2rem',
  backgroundColor: 'white',
  ':hover': {
    backgroundColor: 'white',
    borderColor: theme.palette.primary.main,
  },
};

const buttonSpanStyles = {
  paddingLeft: '.5em',
  color: 'rgba(29, 34, 39, 0.87)',
  fontFamily: 'Poppins',
  fontSize: '0.8125rem',
};

const TimeSeries = () => {
  const exportData = useRef<Record<string, number>[]>([]);
  const [resolution, setResolution] = useState<Resolution>(
    ResolutionValues.DAY,
  );
  const [month, setMonth] = useState<Month>('All');
  const [year, setYear] = useState<number>(moment().year());

  const {
    timeStamps: priceVolumeTimeStamps,
    timeStampValues: priceVolumeTimeStampValues,
    fetchedTimeSeries: timeSeriesPriceVolume,
  } = useGetTimeSeriesData({
    timeSeriesType: TimeSeriesTypeEnum.PRICE_VOLUME,
    resolution,
    year,
    month,
  });

  const {
    timeStamps: nftCountTimeStamps,
    timeStampValues: nftCountTimeStampValues,
    firstYearTimeSeriesRecord,
    fetchedTimeSeries: timeSeriesNftCount,
  } = useGetTimeSeriesData({
    timeSeriesType: TimeSeriesTypeEnum.NFT_COUNT,
    resolution,
    year,
    month,
  });

  useEffect(() => {
    if (timeSeriesPriceVolume?.length && timeSeriesNftCount?.length) {
      const dataForExport = getDataForExport([
        {
          timeseries: destroyReferenceAndClone(timeSeriesPriceVolume),
          context: TimeSeriesTypeEnum.PRICE_VOLUME,
        },
        {
          timeseries: destroyReferenceAndClone(timeSeriesNftCount),
          context: TimeSeriesTypeEnum.NFT_COUNT,
        },
      ]);
      exportData.current = dataForExport;
    }
  }, [timeSeriesNftCount, timeSeriesPriceVolume]);

  const handleResolutionChange = (event: MouseEvent<HTMLElement>) => {
    const newResolution = (event.target as HTMLInputElement)
      .value as Resolution;
    setResolution(newResolution);
  };

  const handleMonthChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newMonth = event.target.value as Month;
    setMonth(newMonth);
  };

  const handleYearChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newYear = event.target.value as unknown as number;
    setYear(newYear);
  };

  const exportCsvOptions = {
    fieldSeparator: ',',
    filename: 'Analytics',
    showLabels: true,
    useTextFile: false,
    useBom: true,
    useKeysAsHeaders: true,
  };

  const csvExporter = new ExportToCsv(exportCsvOptions);

  return (
    <Grid container direction="column" spacing={2} wrap={'nowrap'}>
      <Grid container justifyContent={'space-between'} gap={1} item>
        <Grid item>
          <Paper sx={{ padding: '20px' }}>
            <TimeSeriesFilter
              resolution={resolution}
              year={year}
              month={month}
              firstYearTimeSeriesRecord={firstYearTimeSeriesRecord}
              handleResolutionChange={handleResolutionChange}
              handleMonthChange={handleMonthChange}
              handleYearChange={handleYearChange}
            />
          </Paper>
        </Grid>
        <Grid item>
          <Button
            variant="outlined"
            sx={buttonStyles}
            onClick={() => csvExporter.generateCsv(exportData.current)}
          >
            <DownloadIcon style={{ fontSize: '20px' }} />
            <span style={buttonSpanStyles}>EXPORT</span>
          </Button>
        </Grid>
      </Grid>
      <Grid container item gap={1} wrap={'nowrap'}>
        <Grid item xs>
          <Paper sx={{ padding: '20px' }}>
            <BarChartTimeSeries
              timeSeriesType={TimeSeriesTypeEnum.PRICE_VOLUME}
              timeStamps={priceVolumeTimeStamps}
              timeStampValues={priceVolumeTimeStampValues}
            />
          </Paper>
        </Grid>
        <Grid item xs>
          <Paper sx={{ padding: '20px' }}>
            <BarChartTimeSeries
              timeSeriesType={TimeSeriesTypeEnum.NFT_COUNT}
              timeStamps={nftCountTimeStamps}
              timeStampValues={nftCountTimeStampValues}
            />
          </Paper>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default TimeSeries;
