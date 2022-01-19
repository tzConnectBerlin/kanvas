
import * as React from 'react';
import Welcome from './Welcome';
import CardWithIcon from '../CardWithIcon';
import EuroIcon from '@material-ui/icons/Euro';
import PeopleAltRoundedIcon from '@material-ui/icons/PeopleAltRounded';
import ShoppingCartRoundedIcon from '@material-ui/icons/ShoppingCartRounded';
import InsertPhotoIcon from '@material-ui/icons/InsertPhoto';
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
import { Theme, useMediaQuery } from '@mui/material';
import { makeStyles } from '@material-ui/core/styles';
import NftThumbnail from '../NftThumbnail';
import ListNftThumbnail from '../ListNftThumbnail';


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
  },

})

const styles = {
  flex: { display: 'flex' },
  flexColumn: { display: 'flex', flexDirection: 'column' },
  leftCol: { flex: 1, marginRight: '0.5em' },
  rightCol: { flex: 1, marginLeft: '0.5em' },
  singleCol: { marginTop: '1em', marginBottom: '1em' },
};

const Spacer = () => <span style={{ width: '1em' }} />;
const VerticalSpacer = () => <span style={{ height: '1em' }} />;

// Mock
const nfts = [
  {
      image: 'https://images.unsplash.com/photo-1603344204980-4edb0ea63148?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8ZHJhd2luZ3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=900&q=60',
      price: 3421,
      description: '',
      state: 'pending',
      name: 'Nft 1'
  },
  {
      image: 'https://images.unsplash.com/photo-1585007600263-71228e40c8d1?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=3870&q=80',
      price: 789,
      description: '',
      state: 'pending',
      name: 'Nft 1'
  },
  {
      image: 'https://images.unsplash.com/photo-1578321926534-133bb2a9f080?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2568&q=80',
      price: 234,
      description: '',
      state: 'pending',
      name: 'Nft 1'
  },
  {
      image: 'https://images.unsplash.com/photo-1615639164213-aab04da93c7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1974&q=80',
      price: 35,
      description: '',
      state: 'pending',
      name: 'Nft 1'
  },
  {
      image: 'https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTJ8fHBhaW50aW5nc3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=900&q=60',
      price: 443,
      description: '',
      state: 'pending',
      name: 'Nft 1'
  },
  {
      image: 'https://images.unsplash.com/photo-1625014618427-fbc980b974f5?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=3764&q=80',
      price: 934,
      description: '',
      state: 'pending',
      name: 'Nft 1'
  },
  {
      image: 'https://images.unsplash.com/photo-1633957897986-70e83293f3ff?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1986&q=80',
      price: 28,
      description: '',
      state: 'pending',
      name: 'Nft 1'
  },
]

export const Dashboard = () => {
  const classes = useStyles()
  const isXSmall = useMediaQuery((theme: Theme) =>
    'max-width: 600px'
  );
  const isSmall = useMediaQuery((theme: Theme) =>
    'max-width: 840px'
  );

  return isXSmall ? (
    <div>
      <div style={styles.flexColumn as React.CSSProperties}>
        <Welcome />
        <CardWithIcon
          to="/"
          icon={EuroIcon}
          title="Total revenue"
          subtitle={`2400 EUR`}
        />
        <VerticalSpacer />
        <CardWithIcon
          to="/"
          icon={ShoppingCartRoundedIcon}
          title="Recent orders (24h)"
          subtitle='17'
        />
        <VerticalSpacer />
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
      </div>
    </div>
  ) : isSmall ? (
    <div style={styles.flexColumn as React.CSSProperties}>
      <div style={styles.singleCol}>
        <Welcome />
      </div>
      <div style={styles.flex}>
        <CardWithIcon
          to="/"
          icon={EuroIcon}
          title="Total revenue"
          subtitle={`2400 EUR`}
        />
        <Spacer />
        <CardWithIcon
          to="/"
          icon={ShoppingCartRoundedIcon}
          title="Recent orders (24h)"
          subtitle='17'
        />
      </div>
      <div style={styles.singleCol}>
        {/* <OrderChart orders={recentOrders} /> */}
      </div>
      <div style={styles.singleCol}>
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
      </div>
    </div>
  ) : (
    <>
      <Welcome />
      <div style={styles.flex}>
        <div style={styles.leftCol}>
          <div style={styles.flex}>
            <CardWithIcon
              to="/"
              icon={EuroIcon}
              title="Total revenue"
              subtitle={`2400 EUR`}
            />
            <Spacer />
            <CardWithIcon
              to="/"
              icon={ShoppingCartRoundedIcon}
              title="Recent orders (24h)"
              subtitle='17'
            />
          </div>
          <div style={styles.singleCol}>
            {/* <OrderChart orders={recentOrders} /> */}
          </div>
          <div style={styles.singleCol}>
            <CardWithIcon
              to="/"
              icon={InsertPhotoIcon}
              title="Latest sold (24h)"
              subtitle={nfts.length}
            >
              <ListNftThumbnail nfts={nfts} />
            </CardWithIcon>
          </div>
        </div>
        <div style={styles.rightCol}>
          <div style={styles.flex}>
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
          </div>
        </div>
      </div>
    </>
  );
};
