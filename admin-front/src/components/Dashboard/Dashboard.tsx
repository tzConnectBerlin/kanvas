
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
import authProvider from '../../auth/authProvider';


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

  const [permissions, setPermissions] = React.useState<number[]>([])

  React.useEffect(() => {
    const perm = async () => {
      setPermissions(await authProvider.getPermissions())
    }
    perm()
  }, [])

  const [totalNFTPriceRevenue, setTotalNFTPriceRevenue] = React.useState<number>(0)
  const [totalNFTCount24h, setTotalNFTCount24h] = React.useState<number>(0)
  const [roles, setRoles] = React.useState<{ [i: string]: number }>()

  const [topBuyers, setTopBuyers] = React.useState([])
  const [mostViewed, setMostViewed] = React.useState([])


  const fetchTopBuyers = () => {
    axios.get(process.env.REACT_APP_STORE_BASE_URL + 'api/users/topBuyers', {
      withCredentials: true
    })
      .then(response => {
        setTopBuyers(response.data.topBuyers)
      })
      .catch(error => {
        console.log(error)
      })
  }

  const fetchMostViewed = () => {
    axios.get(process.env.REACT_APP_STORE_BASE_URL + 'api/nfts?pageSize=8&orderBy=views&orderDirection=desc', {
      withCredentials: true
    })
      .then(response => {
        setMostViewed(response.data.nfts)
      })
      .catch(error => {
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
        // notify('An error happened while fetching total revenue')
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
        // notify('An error happened while fetching nft count')
        console.log(error)
      })
  }

  const fetchRoles = () => {
    axios.get(process.env.REACT_APP_API_SERVER_BASE_URL + '/role', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('KanvasAdmin - Bearer')}`
      }
    })
      .then(response => {
        const newRoles: { [i: string]: number; } = {}
        setRoles(response.data.data.map((role: any) => newRoles[role.role_label] = role.id))
      }).catch(error => {
        console.log(error)
        // notify(`An error occured while fetching the roles`);
      })
  }

  React.useEffect(() => {
    fetchTopBuyers()
    fetchMostViewed()
    fetchTotalRevenu()
    fetchNftCount24h()
    fetchRoles()
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
        {
          (roles ? permissions.indexOf(roles["admin"]) !== -1 : false) && (
            <>
              <CardWithIcon
                to="/"
                icon={EuroIcon}
                title="Total revenue"
                subtitle={`${totalNFTPriceRevenue} EUR`}
              />
              <div style={styles.singleCol} >
                <CardWithIcon
                  to="/"
                  icon={ShoppingCartRoundedIcon}
                  title="Nb of sold nfts (24h)"
                  subtitle={totalNFTCount24h.toString()}
                />
              </div>
              <VerticalSpacer />
            </>
          )
        }
        <CardWithIcon
          to="/"
          icon={PeopleAltRoundedIcon}
          title="Top buyers"
          subtitle={topBuyers.length ?? 0}
        >
          <List>
            {
              topBuyers && topBuyers.length ?
                topBuyers.map((user: any, index: number) =>
                  <ListItem >
                    <a className={classes.link} href={process.env.REACT_APP_STORE_BASE_URL + `profile/${user?.userAddress}`} target="_blank">
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
                :
                <div style={{ minHeight: '5rem', height: '100%', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#949494' }}>
                  No Data
                </div>
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
      {
        (roles ? permissions.indexOf(roles["admin"]) !== -1 : false) && (
          <>
            <CardWithIcon
              to="/"
              icon={EuroIcon}
              title="Total revenue"
              subtitle={`${totalNFTPriceRevenue} EUR`}
            />
            <div style={styles.singleCol} >
              <CardWithIcon
                to="/"
                icon={ShoppingCartRoundedIcon}
                title="Nb of sold nfts (24h)"
                subtitle={totalNFTCount24h.toString()}
              />
            </div>
            <VerticalSpacer />
          </>
        )
      }

      <CardWithIcon
        to="/"
        icon={PeopleAltRoundedIcon}
        title="Top buyers"
        subtitle={topBuyers.length ?? 0}
      >
        <List>
          {
            topBuyers && topBuyers.length ?
              topBuyers.map((user: any, index: number) =>
                <ListItem >
                  <a className={classes.link} href={process.env.REACT_APP_STORE_BASE_URL + `profile/${user?.userAddress}`} target="_blank">
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

              :
              <div style={{ minHeight: '5rem', height: '100%', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#949494' }}>
                No Data
              </div>
          }
        </List>
      </CardWithIcon>

    </div>
  ) : (
    <>
      <Welcome />
      <div style={styles.flex}>
        <div style={styles.leftCol}>
          {
            (roles ? permissions.indexOf(roles["admin"]) !== -1 : false) && (
              <>
                <CardWithIcon
                  to="/"
                  icon={EuroIcon}
                  title="Total revenue"
                  subtitle={`${totalNFTPriceRevenue} EUR`}
                />
                <div style={styles.singleCol} >
                  <CardWithIcon
                    to="/"
                    icon={ShoppingCartRoundedIcon}
                    title="Nb of sold nfts (24h)"
                    subtitle={totalNFTCount24h.toString()}
                  />
                </div>
                <VerticalSpacer />
              </>
            )
          }

          <CardWithIcon
            to=""
            icon={InsertPhotoIcon}
            title="Most viewed"
            subtitle={mostViewed.length ?? 0}
          >
            <ListNftThumbnail nfts={mostViewed ?? []} />
            {
              !mostViewed || (mostViewed && mostViewed.length === 0) &&
                <div style={{ minHeight: '5rem', height: '100%', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#949494' }}>
                  No Data
                </div>
            }
          </CardWithIcon>
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
                  topBuyers && topBuyers.length ?
                    topBuyers.map((user: any, index: number) =>
                      <ListItem >
                        <a className={classes.link} href={process.env.REACT_APP_STORE_BASE_URL + `profile/${user?.userAddress}`} target="_blank">
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
                    :
                    <div style={{ minHeight: '5rem', height: '100%', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#949494' }}>
                      No Data
                    </div>
                }
              </List>
            </CardWithIcon>
          </div>
        </div>
      </div>
    </>
  );
};
