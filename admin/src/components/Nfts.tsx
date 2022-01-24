import { Box, Typography } from '@mui/material';
import {
  List,
  Datagrid,
  TextField,
  Edit,
  SimpleForm,
  TextInput,
  Create,
  ImageInput,
  ImageField,
  DateField,
  AutocompleteInput,
  TopToolbar,
  DateInput,
  NumberInput,
} from 'react-admin';
import { JsonInput, JsonField } from 'react-admin-json-view';
import { CustomCreateButton } from './Buttons/CustomCreateButton';
import { CustomDeleteButton } from './Buttons/CustomDeleteButton';
import { CustomExportButton } from './Buttons/CustomExportButton';
import ToolbarActions from './ToolbarActions';
import { makeStyles } from '@material-ui/core/styles';

const NFT_STATES = [
  {
    name: 'Proposal',
    id: 'proposal',
  },
  {
    name: 'Accepted',
    id: 'accepted',
  },
  {
    name: 'Rejected',
    id: 'rejected',
  },
];

const defaultMetadata = {
  symbol: '',
  decimals: 0,
  name: '',
  description: '',
  tags: [],
  displayUrl: '',
  thumbnailUri: '',
  minter: '',
  creators: [],
  contributors: [],
  publishers: [],
};

const useStyle = makeStyles({
  boxWrapper: {
    padding: '2em'
  },
  title: {
    paddingLeft: '1rem',
    fontFamilly: 'Poppins SemiBold !important',
  },
  subtitle: {
    lineHeight: '1.2em !important',
    color: "#c4c4c4 !important",
    marginTop: '0.5rem !important',
    paddingLeft: '1rem'
  },
  form: {
    marginTop: '1rem'
  }
})

export const NftList = ({ ...props }) => (
  <List {...props}
    actions={<ToolbarActions />}
    bulkActionButtons={<CustomDeleteButton {...props} />}
  >
    <Datagrid rowClick="edit" expand={<JsonField source="value" />}>
      <TextField source="id" />
      <TextField source="attributes.name" label="Name" />
      <TextField source="state" label="Current State" />
      <ImageField source="dataUri" label="Image" />
      <DateField source="created_at" label="Created at" showTime />
      <DateField source="updated_at" label="Last updated at" showTime />
      <TextField source="created_by" label="Created by" />
    </Datagrid>
  </List>
);

// Add authorization for allowedActions
export const NftEdit = ({ ...props }) => {

  const classes = useStyle()

  return (
    <Box className={classes.boxWrapper}>
      <Typography variant="h3" component="h1" className={classes.title} style={{ fontFamily: 'Poppins SemiBold' }}>
        Update an NFT
      </Typography>
      <Typography variant="h6" component="h2" className={classes.subtitle} style={{ fontFamily: 'Poppins Light', color: "#C4C4C4 !important", maxWidth: '40%' }}>
        After creating the NFT you will be able to edit as much as you want before submitting it
      </Typography>
      <Edit {...props}>
        <SimpleForm className={classes.form}>
          <TextInput source="attribute.name" label='Name' />
          <TextInput source="attribute.description" label='Description' />
          <NumberInput source="attribute.price" label='Price' />
          <NumberInput source="attribute.tokenAmount" label='Token amount' />
          <DateInput source="attribute.dropDate" label='Drop date' />
          <ImageInput source="picture" accept="image/*">
            <ImageField source="src" title="title" />
          </ImageInput>
        </SimpleForm>
      </Edit>
    </Box>
  );
};

// Add authorization for allowedActions
export const NftCreate = ({ ...props }) => {

  const classes = useStyle()

  return (
    <Box className={classes.boxWrapper}>
      <Typography variant="h3" component="h1" className={classes.title} style={{ fontFamily: 'Poppins SemiBold' }}>
        Create an NFT
      </Typography>
      <Typography variant="h6" component="h2" className={classes.subtitle} style={{ fontFamily: 'Poppins Light', color: "#C4C4C4 !important", maxWidth: '40%' }}>
        After creating the NFT you will be able to edit as much as you want before submitting it
      </Typography>
      <Create {...props}>
        <SimpleForm className={classes.form}>
          <TextInput source="attribute.name" label="Name"/>
          <TextInput source="attribute.description" label="Description" />
          <NumberInput source="attribute.price" label="Price"/>
          <NumberInput source="attribute.tokenAmount" label="Token amount" />
          <DateInput source="attribute.dropDate" label="Drop date" />
          <ImageInput source="picture" accept="image/*">
            <ImageField source="src" title="title" />
          </ImageInput>
        </SimpleForm>
      </Create>
    </Box>
  );
};
