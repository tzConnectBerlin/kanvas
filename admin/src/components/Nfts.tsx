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
} from 'react-admin';
import { JsonInput, JsonField } from 'react-admin-json-view';
import { CustomCreateButton } from './Buttons/CustomCreateButton';
import { CustomDeleteButton } from './Buttons/CustomDeleteButton';
import { CustomExportButton } from './Buttons/CustomExportButton';
import ToolbarActions from './ToolbarActions';

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

export const NftList = ({ ...props }) => (
  <List {...props}
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
