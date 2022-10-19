import './App.css';
import { Admin, Resource } from 'react-admin';
import { Route } from 'react-router-dom';
// import jsonServerProvider from 'ra-data-json-server';
import BurstMode from '@mui/icons-material/BurstMode';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import InsightsIcon from '@mui/icons-material/Insights';
import { theme } from 'theme';

import authProvider from 'auth/authProvider';
import dataProvider from 'data/dataProvider';

import Dashboard from 'components/Dashboard';
import CustomLayout from 'components/CustomLayout';
import { UserList, UserEdit, UserCreate } from './components/Users';
import { NftList, NftEdit, NftCreate } from './components/Nfts';
import NotFound from 'components/NotFound';
import { ActivityList } from 'components/Activities';
import TimeSeries from 'components/TimeSeries/TimeSeries';
import Profile from 'components/Profile';

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
      dataProvider={dataProvider(
        process.env.REACT_APP_API_SERVER_BASE_URL ?? 'http://localhost:3001',
      )}
      disableTelemetry
      authProvider={authProvider}
      customRoutes={[
        <Route
          exact
          key={'my-profile'}
          path="/my-profile"
          component={Profile}
        />,
      ]}
      theme={theme}
    >
      <Resource
        name="user"
        list={UserList}
        edit={UserEdit}
        create={UserCreate}
      />
      <Resource
        name="nft"
        list={NftList}
        edit={NftEdit}
        create={NftCreate}
        icon={BurstMode}
      />
      <Resource
        name="analytics/activities"
        list={ActivityList}
        icon={EqualizerIcon}
        options={{
          label: 'Reporting',
        }}
      />
      <Resource
        name="analytics/sales"
        list={TimeSeries}
        icon={InsightsIcon}
        options={{
          label: 'Analytics',
        }}
      />
      <Resource name="categories" />
      <Resource name="role" />
      <Resource name="categories/assignable" />
      <Resource name="analytics/sales/priceVolume/snapshot" />
      <Resource name="analytics/sales/NftCount/snapshot" />
      <Resource name="kanvas.tzconnect.berlin/api/users/topBuyers" />
    </Admin>
  );
}

export default App;
