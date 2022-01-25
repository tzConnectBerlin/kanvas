import { Card, CardContent, Typography, IconButton } from '@mui/material';
import CloseIcon from '@material-ui/icons/Close';
import {
  List,
  Datagrid,
  TextField,
  Edit,
  Create,
  ImageInput,
  ImageField,
  AutocompleteInput,
  TopToolbar,
  useEditController,
  EditContextProvider,
  useTranslate,
  TextInput,
  SimpleForm,
  DateField,
  EditProps,
  EditButton,
  Button,
} from 'react-admin';
import { JsonInput, JsonField } from 'react-admin-json-view';
import { CustomCreateButton } from './Buttons/CustomCreateButton';
import HomeIcon from '@mui/icons-material/Home';
import { CustomDeleteButton } from './Buttons/CustomDeleteButton';
import { CustomExportButton } from './Buttons/CustomExportButton';
// import ProductReferenceField from '../products/ProductReferenceField';
// import CustomerReferenceField from '../visitors/CustomerReferenceField';
import ToolbarActions from './ToolbarActions';
import {
  HasOrderedFilter,
  HasNewsletterFilter,
  SegmentFilter,
  Name,
  Description,
  DropDateFilter,
  Price,
  State,
  Creator,
  UpdatedAt,
  CreatedAt,
} from './filters';
import { makeStyles } from '@material-ui/core/styles';
import { Review } from '../type';
import StarRatingField from './StarRatingField';
import { useState } from 'react';

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

const Aside = ({ ...props }) => (
  <div style={{ width: 300, margin: '0 2rem' }}>
    <Card>
      <CardContent>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6">Review detail</Typography>
          <CloseIcon />
        </div>
        
        <Name />
        <Description />
        <Price />
        <Creator />
        <CreatedAt />
        <UpdatedAt />
        <State />
        <HasOrderedFilter />
        <DropDateFilter />
        <SegmentFilter />
        <EditButton variant="contained" label="edit" style={{marginRight: '.5rem'}} />
        <Button variant="contained"
          href="/preview/"
          className='MuiButton-containedPrimary'
          startIcon={<HomeIcon />} 
          label="Preview"  
        />
         
      </CardContent>
    </Card>
  </div>
);

export const NftList = ({ ...props }) => {
  const [openAside, setOpenAside] = useState(false);

  const handleClick = () => {
    setOpenAside(!openAside);
  };
  return (
    <List
      aside={<Aside />}
      {...props}
      filter={{ disabled: false }}
      actions={<ToolbarActions />}
      bulkActionButtons={<CustomDeleteButton {...props} />}
    >
      <Datagrid rowClick="edit" expand={<JsonField source="metadata" />}>
        <TextField source="id" />
        <TextField source="nftName" label="Name" />
        <TextField source="nftState" label="Current State" />
        <ImageField source="dataUri" label="Image" />
        <DateField source="createdAt" label="Created at" showTime />
        <DateField source="updatedAt" label="Last updated at" showTime />
      </Datagrid>
    </List>
  );
};

// Add authorization for allowedActions
export const NftEdit = ({ ...props }) => {
  return (
    <Edit {...props}>
      <SimpleForm>
        <TextInput source="id" disabled />
        <TextInput source="nftName" />
        <AutocompleteInput source="nftState" choices={NFT_STATES} />
        <TextInput source="ipfsHash" />
        <TextInput source="nftContract" />
        <TextInput source="tokenId" />
        <JsonInput source="metadata" />
        <ImageInput source="image" accept="image/*">
          <ImageField source="src" title="title" />
        </ImageInput>
      </SimpleForm>
    </Edit>
  );
};

// Add authorization for allowedActions
export const NftCreate = ({ ...props }) => {
  return (
    <Create {...props}>
      <SimpleForm>
        <TextInput source="id" disabled />
        <TextInput source="nftName" />
        <JsonInput source="metadata" defaultValue={defaultMetadata} />
        <ImageInput source="image" accept="image/*">
          <ImageField source="src" title="title" />
        </ImageInput>
      </SimpleForm>
    </Create>
  );
};
function props<T>(props: any) {
  throw new Error('Function not implemented.');
}
