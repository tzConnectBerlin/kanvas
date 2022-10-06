// Add authorization for allowedActions
import {
  Create,
  SimpleForm,
  TextInput,
  useNotify,
  useRedirect,
  useRefresh,
} from 'react-admin';
import { Box, Typography } from '@mui/material';
import { useStyle } from './useStyle';

export const NftCreate = ({ ...props }) => {
  const classes = useStyle();

  const notify = useNotify();
  const refresh = useRefresh();
  const redirect = useRedirect();

  const onSuccess = () => {
    notify(`Nft created successfully`);
    redirect('/nft');
    refresh();
  };

  return (
    <Create onSuccess={onSuccess} {...props}>
      <SimpleForm className={classes.form}>
        <Box className={classes.boxWrapper}>
          <Typography
            variant="h4"
            component="h1"
            className={classes.title}
            style={{ fontFamily: 'Poppins SemiBold' }}
          >
            Create an NFT
          </Typography>
          <TextInput source="attributes.name" label="Name" />
        </Box>
      </SimpleForm>
    </Create>
  );
};
