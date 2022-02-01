import './App.css';
import { Admin, Resource } from 'react-admin';
// import jsonServerProvider from 'ra-data-json-server';
import { UserList, UserEdit, UserCreate } from './components/Users';
import { NftList, NftEdit, NftCreate } from './components/Nfts';
import Dashboard from './components/Dashboard';
import NotFound from './components/NotFound';
import authProvider from './auth/authProvider';
import dataProvider from './data/dataProvider';
import CustomLayout from './components/CustomLayout';
import { theme } from './theme';

import NftIcon from '@material-ui/icons/BurstMode';
import { ActivityList } from './components/Activities';
import EqualizerIcon from '@mui/icons-material/Equalizer';

//for data from the nest admin api

//for data in a json format for testing
// `npm i -g json-server` `json-server --watch __mocks__/users-nftsv1.json -p 3002`
// const dataProvider = jsonServerProvider('http://localhost:3002');

function App() {
  return (
    <Admin
      title="Kanvas - Admin"
      layout={CustomLayout}
      catchAll={NotFound}
      dashboard={Dashboard}
      dataProvider={dataProvider('http://')}
      disableTelemetry
      authProvider={authProvider}
      theme={theme}
    >
      <Resource
        name="localhost:3001/user"
        options={{ label: `user` }}
        list={UserList}
        edit={UserEdit}
        create={UserCreate}
      />
      <Resource
        name="localhost:3001/nft"
        options={{ label: `nft` }}
        list={NftList}
        edit={NftEdit}
        create={NftCreate}
        icon={NftIcon}
      />
      <Resource
      options={{ label: `activity` }}
        name="localhost:3001/activity"
        list={ActivityList}
        icon={EqualizerIcon}
      />
      <Resource
        name="localhost:3001/categories"
      />
      <Resource
        name="localhost:3001/categories/assignable"
      />
      <Resource
        name="localhost:3001/analytics/sales/priceVolume/snapshot"
      />
      <Resource
        name="kanvas.tzconnect.berlin/api/users/topBuyers"
      />
    </Admin>
  );
}

export default App;
function simpleRestProvider(arg0: string) {
  throw new Error('Function not implemented.');
}

