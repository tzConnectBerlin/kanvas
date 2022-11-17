import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker as MUIDateTimePicker } from '@mui/x-date-pickers/DateTimePicker/DateTimePicker';
import TextField from '@mui/material/TextField';
import { theme } from '../../theme';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { Dayjs } from 'dayjs';
import { isUS } from '../../utils/utils';

interface DateTimePickerProps {
  value: Dayjs;
  handleChange: (value: Dayjs | null) => void;
  label: string;
}

const DateTimePicker = ({
  value,
  handleChange,
  label,
}: DateTimePickerProps) => {
  const dateFormat = isUS() ? 'MM/DD' : 'DD/MM';

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <MUIDateTimePicker
        renderInput={(props) => (
          <TextField
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: `${theme.palette.primary.main}`,
                },
              },
              '& label': {
                '&.Mui-focused': {
                  color: `${theme.palette.primary.main}`,
                },
              },
            }}
            {...props}
          />
        )}
        inputFormat={dateFormat + '/YYYY hh:mm A'}
        value={value}
        onChange={(newValue) => handleChange(newValue)}
        label={label}
      />
    </LocalizationProvider>
  );
};

export default DateTimePicker;
