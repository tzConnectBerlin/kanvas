import { SyntheticEvent, useState } from 'react';
import { Paper, Tab } from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import 'chart.js/auto';
import { SalesPriceVolume } from './SalesPriceVolume';
import { SalesNftCount } from './SalesNftCount';
import { theme } from 'theme';

const TimeSeries = () => {
  const [value, setValue] = useState('1');

  const handleTabChange = (event: SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  const makeColor = (tabVal: string) => {
    return {
      color: `${
        value === tabVal
          ? theme.palette.primary.main
          : theme.palette.primary.light
      }`,
    };
  };

  return (
    <Paper>
      <TabContext value={value}>
        <TabList
          onChange={handleTabChange}
          TabIndicatorProps={{
            style: { background: theme.palette.primary.main },
          }}
          centered
        >
          <Tab label="Sales price volume" value="1" style={makeColor('1')} />
          <Tab label="Sales NFT count" value="2" style={makeColor('2')} />
        </TabList>
        <TabPanel value="1">
          <SalesPriceVolume />
        </TabPanel>
        <TabPanel value="2">
          <SalesNftCount />
        </TabPanel>
      </TabContext>
    </Paper>
  );
};

export default TimeSeries;
