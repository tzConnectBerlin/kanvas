import useGetTimeSeriesData, {
  TimeSeriesType,
} from './hooks/useGetTimeSeriesData';
import { Month, Resolution } from './types';
import { ChangeEvent, MouseEvent, useState } from 'react';
import {
  Grid,
  MenuItem,
  SxProps,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
} from '@mui/material';
import { theme } from 'theme';
import moment from 'moment';
import { Bar } from 'react-chartjs-2';
import { styled } from '@mui/material/styles';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(() => ({
  root: {
    '& .MuiOutlinedInput-root': {
      '& fieldset': {
        borderColor: 'rgba(0, 0, 0, 0.12)',
      },
      '&:hover fieldset': {
        borderColor: 'rgba(0, 0, 0, 0.20)',
      },
      '&.Mui-focused fieldset': {
        border: '1px solid rgba(0, 0, 0, 0.20)',
      },
    },
  },
}));

const ToggleButtonStyled = styled(ToggleButton)({
  '&.Mui-selected, &.Mui-selected:hover': {
    color: theme.palette.primary.main,
    backgroundColor: `${theme.palette.primary.main}26`,
  },
});

const textFieldSx: SxProps = {
  minWidth: 120,
  '.MuiOutlinedInput-input': {
    paddingTop: '8px',
    paddingBottom: '8px',
    color: 'rgba(0, 0, 0, 0.54)',
  },
};

const menuItemSx: SxProps = {
  '&.Mui-selected': {
    backgroundColor: `${theme.palette.primary.main}80`,
    '&:hover': {
      backgroundColor: `${theme.palette.primary.main}80`,
    },
  },
  '&:hover': {
    backgroundColor: `${theme.palette.primary.main}26`,
  },
};

const getYears = () => {
  const years = [];

  for (let year = 2022; year <= moment().year(); year++) {
    years.push({ value: year, label: year });
  }

  return years;
};

const months = [
  {
    value: 'All',
    label: 'All months',
  },
  {
    value: 'January',
    label: 'January',
  },
  {
    value: 'February',
    label: 'February',
  },
  {
    value: 'March',
    label: 'March',
  },
  {
    value: 'April',
    label: 'April',
  },
  {
    value: 'May',
    label: 'May',
  },
  {
    value: 'June',
    label: 'June',
  },
  {
    value: 'July',
    label: 'July',
  },
  {
    value: 'August',
    label: 'August',
  },
  {
    value: 'September',
    label: 'September',
  },
  {
    value: 'October',
    label: 'October',
  },
  {
    value: 'November',
    label: 'November',
  },
  {
    value: 'December',
    label: 'December',
  },
];

interface BarChartTimeSeriesProps {
  timeSeriesType: TimeSeriesType;
}

const BarChartTimeSeries = ({ timeSeriesType }: BarChartTimeSeriesProps) => {
  const [resolution, setResolution] = useState<Resolution>('day');
  const [month, setMonth] = useState<Month>('All');
  const [year, setYear] = useState<number>(moment().year());

  const { timeStamps, timeStampValues } = useGetTimeSeriesData({
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
            {getYears().map((year) => (
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
