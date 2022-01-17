
import * as React from 'react';
import Welcome from './Welcome';
import CardWithIcon from '../CardWithIcon';
import EuroIcon from '@material-ui/icons/Euro';
import PeopleAltRoundedIcon from '@material-ui/icons/PeopleAltRounded';
import ShoppingCartRoundedIcon from '@material-ui/icons/ShoppingCartRounded';
import {
  Avatar,
  Box,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from '@material-ui/core';

import { Grid } from '@material-ui/core';
import { ListItemIcon, Stack } from '@mui/material';
import { ClassNames } from '@emotion/react';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles({
  link: {
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  spacer: {
    flexGrow: 1,
  },
  alignRight: {
    textAlign: 'right'
  }
})

export const Dashboard = () => {
  const classes = useStyles()

  return (
    <Stack>
      <Welcome />
      <Stack sx={{ marginBottom: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <CardWithIcon
              to="/"
              icon={EuroIcon}
              title="Total revenue"
              subtitle={`2400 EUR`}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <CardWithIcon
              to="/"
              icon={ShoppingCartRoundedIcon}
              title="Recent orders (24h)"
              subtitle='17'
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <CardWithIcon
              to="/"
              icon={PeopleAltRoundedIcon}
              title="Top buyers"
              subtitle='12'
            >
              <List>
                {
                  [...Array(12)].map((user: any, index: number) =>
                    <ListItem >
                      <a className={classes.link} href={`https://kanvas.tzconnect.berlin/profile/${user?.address ?? 'tz1KhMoukVbwDXRZ7EUuDm7K9K5EmJSGewxd'}`} target="_blank">
                        <ListItemAvatar >
                          <Avatar src="https://kanvas-files.s3.amazonaws.com/profilePicture_7" />
                        </ListItemAvatar>
                        <ListItemText
                          primary={`username - ${index}`}
                        />
                        <div className={classes.spacer} />
                        <ListItemText
                          primary={`33 ꜩ`}
                          className={classes.alignRight}
                        />
                      </a>
                    </ListItem>
                  )
                }
              </List>
            </CardWithIcon>
          </Grid>
        </Grid>
      </Stack>
    </Stack>
  )
};
