import { ChangeEvent, FC, MouseEvent } from 'react';
import {
  Grid,
  MenuItem,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { theme } from 'theme';
import {
  getYears,
  menuItemSx,
  Month,
  months,
  Resolution,
  textFieldSx,
  TimeSeriesRecord,
  useStyles,
} from './utility';
import { getYearFromTimeStamp } from './functions';

const ToggleButtonStyled = styled(ToggleButton)({
  '&.Mui-selected, &.Mui-selected:hover': {
    color: theme.palette.primary.main,
    backgroundColor: `${theme.palette.primary.main}26`,
  },
});

interface TimeSeriesFilterProps {
  resolution: Resolution;
  year: number;
  month: Month;
  firstYearTimeSeriesRecord: TimeSeriesRecord;
  handleResolutionChange: (event: MouseEvent<HTMLElement>) => void;
  handleMonthChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleYearChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

const TimeSeriesFilter: FC<TimeSeriesFilterProps> = ({
  resolution,
  year,
  month,
  firstYearTimeSeriesRecord,
  handleResolutionChange,
  handleMonthChange,
  handleYearChange,
}) => {
  const classes = useStyles();

  return (
    <>
      <Grid container gap={1} wrap={'nowrap'}>
        <Grid container item gap={1} wrap={'nowrap'}>
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
                getYearFromTimeStamp(firstYearTimeSeriesRecord.timestamp),
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
    </>
  );
};

export default TimeSeriesFilter;
