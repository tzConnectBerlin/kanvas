import { ChangeEvent, MouseEvent, useState } from 'react';
import {
  Grid,
  MenuItem,
  ToggleButtonGroup,
  TextField,
  ToggleButton,
} from '@mui/material';
import { theme } from 'theme';
import moment from 'moment';
import { Bar } from 'react-chartjs-2';
import {
  Month,
  Resolution,
  ResolutionValues,
  TimeSeriesType,
  menuItemSx,
  textFieldSx,
  useStyles,
  getYears,
  months,
} from './utility';
import useGetTimeSeriesData from './hooks/useGetTimeSeriesData';
import { getYearFromTimeStamp } from './functions';
import { styled } from '@mui/material/styles';

const ToggleButtonStyled = styled(ToggleButton)({
  '&.Mui-selected, &.Mui-selected:hover': {
    color: theme.palette.primary.main,
    backgroundColor: `${theme.palette.primary.main}26`,
  },
});

interface BarChartTimeSeriesProps {
  timeSeriesType: TimeSeriesType;
}

const BarChartTimeSeries = ({ timeSeriesType }: BarChartTimeSeriesProps) => {
  const [resolution, setResolution] = useState<Resolution>(
    ResolutionValues.DAY,
  );
  const [month, setMonth] = useState<Month>('All');
  const [year, setYear] = useState<number>(moment().year());

  const { timeStamps, timeStampValues, fetchedTimeSeries } =
    useGetTimeSeriesData({
      timeSeriesType,
      resolution,
      year,
      month,
    });

  const classes = useStyles();

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

  const chartData = {
    labels: timeStamps,
    datasets: [
      {
        label: timeSeriesType === 'priceVolume' ? 'Price Volume' : 'NFT Count',
        backgroundColor: `${theme.palette.primary.main}80`,
        borderColor: `${theme.palette.primary.main}`,
        borderWidth: 1,
        data: timeStampValues,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <>
      <Grid container alignItems="center" gap={1}>
        <Grid item>
          <TextField
            size="small"
            id="outlined-select-year"
            select
            value={year}
            onChange={(event) =>
              handleYearChange(event as ChangeEvent<HTMLInputElement>)
            }
            className={classes.root}
            sx={textFieldSx}
          >
            {getYears(
              getYearFromTimeStamp(fetchedTimeSeries?.[0].timestamp),
            ).map((year) => (
              <MenuItem sx={menuItemSx} key={year.value} value={year.value}>
                {year.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item>
          <TextField
            size="small"
            id="outlined-select-month"
            select
            value={month}
            onChange={(event) =>
              handleMonthChange(event as ChangeEvent<HTMLInputElement>)
            }
            className={classes.root}
            sx={textFieldSx}
          >
            {months.map((month) => (
              <MenuItem sx={menuItemSx} key={month.value} value={month.value}>
                {month.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item>
          <ToggleButtonGroup
            color="primary"
            value={resolution}
            exclusive
            onChange={(event) => handleResolutionChange(event)}
            aria-label="Resolution"
            size="small"
          >
            <ToggleButtonStyled value="hour">Hour</ToggleButtonStyled>
            <ToggleButtonStyled value="day">Day</ToggleButtonStyled>
            <ToggleButtonStyled value="week">Week</ToggleButtonStyled>
            <ToggleButtonStyled value="month">Month</ToggleButtonStyled>
          </ToggleButtonGroup>
        </Grid>
      </Grid>
      <Bar data={chartData} options={chartOptions} />
    </>
  );
};

export default BarChartTimeSeries;
