import { List } from 'react-admin';
import { Grid, SxProps } from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';
import DataGridWrapper from './DataGridWrapper';
import { useState } from 'react';
import utc from 'dayjs/plugin/utc';
import DateTimePicker from './DateTimePicker';
dayjs.extend(utc);

export const ActivityList = ({ ...props }) => {
  const [fromValue, setFromValue] = useState<Dayjs>(
    dayjs(dayjs()).subtract(31, 'day'),
  );
  const [toValue, setToValue] = useState<Dayjs>(dayjs());

  const handleFromChange = (value: Dayjs | null) => {
    if (value !== null && dayjs(value).isValid()) {
      setFromValue(value);
    }
  };

  const handleToChange = (value: Dayjs | null) => {
    if (value !== null && dayjs(value).isValid()) {
      setToValue(value);
    }
  };

  return (
    <>
      <Grid container spacing={2}>
        <Grid item>
          <DateTimePicker
            handleChange={handleFromChange}
            value={fromValue}
            label="From"
          />
        </Grid>
        <Grid item>
          <DateTimePicker
            handleChange={handleToChange}
            value={toValue}
            label="To"
          />
        </Grid>
      </Grid>
      <List {...props} sort={{ field: 'id', order: 'DESC' }}>
        <DataGridWrapper fromValue={fromValue} toValue={toValue} />
      </List>
    </>
  );
};
