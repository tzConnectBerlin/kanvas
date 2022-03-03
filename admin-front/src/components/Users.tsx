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
import React from 'react';
import { TextArrayField } from './TextArrayField';
import ToolbarActions from './ToolbarActions';
import axios from 'axios';

const test = {
  1: "Admin",
  2: "test",
  3: "supertest"
}

export const UserList = ({ ...props }) => {

  const [roles, setRoles] = React.useState<{ [i: number]: string; }>({})
  const notify = useNotify();

  React.useEffect(() => {
    axios.get(process.env.REACT_APP_API_SERVER_BASE_URL + '/role', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('KanvasAdmin - Bearer')}`
      }
    })
      .then(response => {
        const newRoles: { [i: number]: string; } = {}
        setRoles(response.data.data.map((role: any) => newRoles[role.id] = role.role_label.charAt(0).toUpperCase() + role.role_label.slice(1)))
        debugger
      }).catch(error => {
        notify(`An error occured while fetching the roles`);
      })
  }, [])

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
        <TextArrayField source="roles" value={roles}>
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

  const [roles, setRoles] = React.useState([])

  React.useEffect(() => {
    axios.get(process.env.REACT_APP_API_SERVER_BASE_URL + '/role', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('KanvasAdmin - Bearer')}`
      }
    })
      .then(response => {
        setRoles(response.data.data.map((role: any) => ({ id: role.id, name: role.role_label.charAt(0).toUpperCase() + role.role_label.slice(1) })))
      }).catch(error => {
        notify(`An error occured while fetching the roles`);
      })
  }, [])

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
            choices={roles}
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

  const [roles, setRoles] = React.useState([])

  React.useEffect(() => {
    debugger
    axios.get(process.env.REACT_APP_API_SERVER_BASE_URL + '/role', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('KanvasAdmin - Bearer')}`
      }
    })
      .then(response => {
        setRoles(response.data.data.map((role: any) => ({ id: role.id, name: role.role_label.charAt(0).toUpperCase() + role.role_label.slice(1) })))
      }).catch(error => {
        notify(`An error occured while fetching the roles`);
      })
  }, [])

  return props?.permissions?.includes(1) ? (
    <Create onSuccess={onSuccess} {...props}>
      <SimpleForm>
        <TextInput source="userName" />
        <TextInput source="address" />
        <TextInput source="email" />
        <PasswordInput source="password" />
        <SelectArrayInput
          source="roles"
          choices={roles}
        />
      </SimpleForm>
    </Create>
  ) : (
    <>'You dont have access'</>
  );
};
