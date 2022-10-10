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
import { getDecodedToken } from '../../auth/authUtils';
import { CustomDeleteButton } from '../Buttons/CustomDeleteButton';
import { TextArrayField } from '../TextArrayField';
import ToolbarActions from '../ToolbarActions';
import UseGetRolesFromAPI from './hooks/useGetRolesFromAPI';
import useGetRolesFromAPI from './hooks/useGetRolesFromAPI';

export const UserList = ({ ...props }) => {
  const { roles } = UseGetRolesFromAPI({ withId: false });

  return (
    <List
      actions={<ToolbarActions />}
      bulkActionButtons={<CustomDeleteButton {...props} />}
      {...props}
    >
      <Datagrid rowClick="edit">
        <TextField source="id" />
        <TextField source="userName" />
        <EmailField source="email" />
        <TextArrayField source="roles" value={roles as string[]}>
          <SingleFieldList>
            <ChipField />
          </SingleFieldList>
        </TextArrayField>
      </Datagrid>
    </List>
  );
};

export const UserEdit = ({ ...props }) => {
  const { roles } = UseGetRolesFromAPI();
  const notify = useNotify();
  const refresh = useRefresh();
  const redirect = useRedirect();

  const transform = (data: any) => {
    delete data.password;
    delete data.disabled;
    return data;
  };
  const currentUser = Number(props.id) === getDecodedToken().sub;

  const onSuccess = () => {
    notify(`User updated successfully`);
    redirect('/user');
    refresh();
  };

  return props.permissions?.includes(1) || currentUser ? (
    <Edit
      {...props}
      onSuccess={onSuccess}
      mutationMode="pessimistic"
      transform={transform}
    >
      <SimpleForm>
        <TextInput source="id" disabled />
        <TextInput source="userName" disabled />
        <TextInput source="email" disabled />
        {props.permissions?.includes(1) && (
          <SelectArrayInput
            source="roles"
            choices={roles as Record<string, unknown>[]}
          />
        )}
      </SimpleForm>
    </Edit>
  ) : (
    <>'You dont have access :p'</>
  );
};

export const UserCreate = ({ ...props }) => {
  const { roles } = useGetRolesFromAPI();
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
        <TextInput source="email" />
        <PasswordInput source="password" />
        <SelectArrayInput
          source="roles"
          choices={roles as Record<string, unknown>[]}
        />
      </SimpleForm>
    </Create>
  ) : (
    <>'You dont have access'</>
  );
};
