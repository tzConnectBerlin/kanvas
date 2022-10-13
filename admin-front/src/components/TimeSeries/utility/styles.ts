import { makeStyles } from '@material-ui/core/styles';
import { SxProps } from '@mui/material';
import { theme } from 'theme';

export const useStyles = makeStyles(() => ({
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

export const textFieldSx: SxProps = {
  minWidth: 120,
  '.MuiOutlinedInput-input': {
    paddingTop: '8px',
    paddingBottom: '8px',
    color: 'rgba(0, 0, 0, 0.54)',
  },
};

export const menuItemSx: SxProps = {
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
