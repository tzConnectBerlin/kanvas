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
  SelectArrayInput,
  ChipField,
  SingleFieldList,
} from 'react-admin';
import { TextArrayField } from './TextArrayField';

export const NftList = ({ ...props }) => (
  <List {...props}>
    <Datagrid rowClick="edit">
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="description" />
      <ImageField source="image" />
      <TextArrayField source="categories">
        <SingleFieldList>
          <ChipField />
        </SingleFieldList>
      </TextArrayField>
      <TextField source="status" />
    </Datagrid>
  </List>
);

export const NftEdit = ({ ...props }) => {
  const categories = [
    { id: 'blue', name: 'Blue' },
    { id: 'apple', name: 'Apple' },
    { id: 'cat', name: 'Cat' },
    { id: 'scooter', name: 'scooter' },
  ];

  return (
    <Edit {...props}>
      <SimpleForm>
        <TextInput source="id" disabled />
        <TextInput source="name" />
        <TextInput source="description" />
        <ImageInput source="image" accept="image/*">
          <ImageField source="src" title="title" />
        </ImageInput>
        <SelectArrayInput source="categories" choices={categories} />
        {props.permissions.includes(2) && <TextInput source="status" />}
      </SimpleForm>
    </Edit>
  );
};

export const NftCreate = ({ ...props }) => {
  const categories = [
    { id: 'blue', name: 'Blue' },
    { id: 'apple', name: 'Apple' },
    { id: 'cat', name: 'Cat' },
    { id: 'scooter', name: 'scooter' },
  ];
  return props.permissions.includes(3) ? (
    <Create {...props}>
      <SimpleForm>
        <TextInput source="name" />
        <TextInput source="description" />
        <ImageInput source="image" accept="image/*">
          <ImageField source="src" title="title" />
        </ImageInput>
        <SelectArrayInput source="categories" choices={categories} />
        <TextInput source="status" defaultValue="initial" disabled />
      </SimpleForm>
    </Create>
  ) : (
    <>'Only Creators can create NFTs'</>
  );
};
