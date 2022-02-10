
import * as React from 'react';
import Welcome from './Welcome';
import CardWithIcon from '../CardWithIcon';
import EuroIcon from '@material-ui/icons/Euro';
import PeopleAltRoundedIcon from '@material-ui/icons/PeopleAltRounded';
import ShoppingCartRoundedIcon from '@material-ui/icons/ShoppingCartRounded';
import InsertPhotoIcon from '@material-ui/icons/InsertPhoto';
import {
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from '@material-ui/core';

import { Theme, useMediaQuery } from '@mui/material';
import { makeStyles } from '@material-ui/core/styles';
import { useDataProvider, useNotify } from 'react-admin';
import ListNftThumbnail from '../ListNftThumbnail';
import axios from 'axios';


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

export const Dashboard = () => {
  const classes = useStyles()
  const notify = useNotify()

  const dataProvider = useDataProvider()
  const [totalNFTPriceRevenue, setTotalNFTPriceRevenue] = React.useState<number>(0)
  const [totalNFTCount24h, setTotalNFTCount24h] = React.useState<number>(0)

  const [topBuyers, setTopBuyers] = React.useState([])
  const [mostViewed, setMostViewed] = React.useState([])

  const fetchTopBuyers = () => {
    axios.get('https://kanvas.tzconnect.berlin/api/users/topBuyers', {
      withCredentials: true, headers: {
        'Content-type': 'application/json'
      }
    })
      .then(response => {
        setTopBuyers(response.data.topBuyers)
      })
      .catch(error => {
        notify('An error happened while fetching the top buyers')
        console.log(error)
      })
  }

  const fetchMostViewed = () => {
    axios.get('https://kanvas.tzconnect.berlin/api/nfts?pageSize=8&orderBy=views&orderDirection=desc', {
      withCredentials: true
    })
      .then(response => {
        setMostViewed(response.data.nfts)
      })
      .catch(error => {
        notify('An error happened while fetching the most viewed nfts')
        console.log(error)
      })
  }

  const fetchTotalRevenu = () => {
    const url = process.env.REACT_APP_API_SERVER_BASE_URL + '/analytics/sales/priceVolume/snapshot?resolution=infinite'
    axios.get(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('KanvasAdmin - Bearer')}`
      },
    })
      .then(response => {
        const price = response.data ? response.data.value : undefined;
        setTotalNFTPriceRevenue(price ?? 0)
      }).catch(error => {
        notify('An error happened while fetching total revenue')
        console.log(error)
      })
  }

  const fetchNftCount24h = () => {
    const url = process.env.REACT_APP_API_SERVER_BASE_URL + '/analytics/sales/nftCount/snapshot?resolution=day'
    axios.get(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('KanvasAdmin - Bearer')}`
      },
    })
      .then(response => {
        const count = response.data ? response.data.value : undefined;
        setTotalNFTCount24h(count ?? 0)
      }).catch(error => {
        notify('An error happened while fetching nft count')
        console.log(error)
      })
  }

  React.useEffect(() => {
    fetchTopBuyers()
    fetchMostViewed()
    fetchTotalRevenu()
    fetchNftCount24h()
  }, [])


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
          subtitle={`${totalNFTPriceRevenue} EUR`}
        />
        <VerticalSpacer />
        <CardWithIcon
          to="/"
          icon={ShoppingCartRoundedIcon}
          title="Nb of sold nfts (24h)"
          subtitle={totalNFTCount24h}
        />
        <VerticalSpacer />
        <CardWithIcon
          to="/"
          icon={PeopleAltRoundedIcon}
          title="Top buyers"
          subtitle={topBuyers.length ?? 0}
        >
          <List>
            {
              topBuyers.map((user: any, index: number) =>
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
          subtitle={`${totalNFTPriceRevenue} EUR`}
        />
        <Spacer />
        <CardWithIcon
          to="/"
          icon={ShoppingCartRoundedIcon}
          title="Nb of sold nfts (24h)"
          subtitle={totalNFTCount24h}
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
          subtitle={topBuyers.length ?? 0}
        >
          <List>
            {
              topBuyers.map((user: any, index: number) =>
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
              subtitle={`${totalNFTPriceRevenue} EUR`}
            />
            <Spacer />
            <CardWithIcon
              to="/"
              icon={ShoppingCartRoundedIcon}
              title="Nb of sold nfts (24h)"
              subtitle={totalNFTCount24h}
            />
          </div>
          <div style={styles.singleCol}>
            {/* <OrderChart orders={recentOrders} /> */}
          </div>
          <div style={styles.singleCol}>
            <CardWithIcon
              to="/"
              icon={InsertPhotoIcon}
              title="Most viewed"
              subtitle={mostViewed.length ?? 0}
            >
              <ListNftThumbnail nfts={mostViewed ?? []} />
            </CardWithIcon>
          </div>
        </div>
        <div style={styles.rightCol}>
          <div style={styles.flex}>
            <CardWithIcon
              to="/"
              icon={PeopleAltRoundedIcon}
              title="Top buyers"
              subtitle={topBuyers.length ?? 0}
            >
              <List>
                {
                  topBuyers.map((user: any, index: number) =>
                    <ListItem >
                      <a className={classes.link} href={`https://kanvas.tzconnect.berlin/profile/${user?.address ?? 'tz1KhMoukVbwDXRZ7EUuDm7K9K5EmJSGewxd'}`} target="_blank">
                        <ListItemAvatar >
                          <Avatar src={user.userPicture} />
                        </ListItemAvatar>
                        <ListItemText
                          primary={user.userName}
                        />
                        <div className={classes.spacer} />
                        <ListItemText
                          primary={`${user.totalPaid} ꜩ`}
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
