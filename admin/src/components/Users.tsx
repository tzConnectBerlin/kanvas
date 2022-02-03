import {
  List,
  Datagrid,
  TextField,
  EmailField,
  Edit,
  SimpleForm,
  TextInput,
  Create,
  SelectArrayInput,
  ChipField,
  SingleFieldList,
  PasswordInput,
  useRefresh,
  useNotify,
  useRedirect,
} from 'react-admin';
import { getDecodedToken } from '../auth/authUtils';
import { CustomDeleteButton } from './Buttons/CustomDeleteButton';

import { TextArrayField } from './TextArrayField';
import ToolbarActions from './ToolbarActions';

// Get this from config file
const rolesEnum = {
  1: 'superadmin',
  2: 'editor',
  3: 'creator',
};

export const UserList = ({ ...props }) => {
  return (
    <List
      actions={<ToolbarActions />}
      bulkActionButtons={<CustomDeleteButton {...props} />}
      {...props}
    >
      <Datagrid rowClick="edit">
        <TextField source="id" />
        <TextField source="userName" />
        <TextField source="address" />
        <EmailField source="email" />
        <TextArrayField source="roles" value={rolesEnum}>
          <SingleFieldList>
            <ChipField />
          </SingleFieldList>
        </TextArrayField>
      </Datagrid>
    </List>
  );
};

export const UserEdit = ({ ...props }) => {
  const transform = (data: any) => {
    delete data.password;
    delete data.disabled;
    return data;
  };
  const currentUser = Number(props.id) === getDecodedToken().sub;

  const notify = useNotify();
  const refresh = useRefresh();
  const redirect = useRedirect();

  const onSuccess = () => {
    notify(`User updated successfully`);
    redirect('/user');
    refresh();
  };

  return props.permissions?.includes(1) || currentUser ? (
    <Edit {...props} onSuccess={onSuccess} mutationMode="pessimistic" transform={transform}>
      <SimpleForm>
        <TextInput source="id" disabled />
        <TextInput source="userName" disabled />
        <TextInput source="address" disabled />
        <TextInput source="email" disabled />
        {props.permissions?.includes(1) && (
          <SelectArrayInput
            source="roles"
            choices={[
              { id: 2, name: 'Editor' },
              { id: 1, name: 'Super Admin' },
              { id: 3, name: 'Creator' },
              { id: 4, name: 'dog' },
            ]}
          />
        )}
      </SimpleForm>
    </Edit>
  ) : (
    <>'You dont have access :p'</>
  );
};

export const UserCreate = ({ ...props }) => {

  const notify = useNotify();
  const refresh = useRefresh();
  const redirect = useRedirect();

  const onSuccess = () => {
    notify(`User created successfully`);
    redirect('/user');
    refresh();
  };

  return props?.permissions?.includes(1) ? (
    <Create onSuccess={onSuccess} {...props}>
      <SimpleForm>
        <TextInput source="userName" />
        <TextInput source="address" />
        <TextInput source="email" />
        <PasswordInput source="password" />
        <SelectArrayInput
          source="roles"
          choices={[
            { id: 2, name: 'Editor' },
            { id: 1, name: 'Super Admin' },
            { id: 3, name: 'Creator' },
            { id: 4, name: 'dog' },
          ]}
        />
      </SimpleForm>
    </Create>
  ) : (
    <>'You dont have access'</>
  );
};
