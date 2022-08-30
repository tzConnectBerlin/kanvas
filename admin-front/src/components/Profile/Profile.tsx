import {
  EmailField,
  RecordContextProvider,
  SimpleForm,
  TextField,
  useGetIdentity,
} from 'react-admin';


export const Profile = () => {
  const userData = useGetIdentity();
  return (
    <RecordContextProvider value={userData.identity}>
      <SimpleForm toolbar={false}>
        <h1>My Profile</h1>
        <TextField source="userName" />
        <EmailField source="email" />
      </SimpleForm>
    </RecordContextProvider>
  );
};
