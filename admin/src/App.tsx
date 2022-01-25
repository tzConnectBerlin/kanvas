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
import { useState } from 'react';
import customRoutes from './routes';
import createHistory from 'history/createBrowserHistory';
 
//for data from the nest admin api
const DataProvider = dataProvider('http://localhost:3001');
//for data in a json format for testing
// `npm i -g json-server` `json-server --watch __mocks__/users-nftsv1.json -p 3002`
// const dataProvider = jsonServerProvider('http://localhost:3002');
 

const history = createHistory();

function App() {
 

  return (
    <Admin
      history={history}
      title="Kanvas - Admin"
      layout={CustomLayout}
      catchAll={NotFound}
      dashboard={Dashboard}
      customRoutes={customRoutes}
      dataProvider={DataProvider}
      disableTelemetry
      authProvider={authProvider}
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
        icon={NftIcon}
      />
 
    </Admin>
      
  );
}

export default App;
