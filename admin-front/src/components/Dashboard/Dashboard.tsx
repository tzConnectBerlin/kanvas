import { CSSProperties } from 'react';
import EuroIcon from '@mui/icons-material/Euro';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import InsertPhotoIcon from '@mui/icons-material/InsertPhoto';
import { Theme, useMediaQuery } from '@mui/material';
import { makeStyles } from '@material-ui/core/styles';
import {
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from '@material-ui/core';
import CardWithIcon from 'components/CardWithIcon';
import ListNftThumbnail from 'components/ListNftThumbnail';
import Welcome from './Welcome';
import useGetDashboardInformation from './hooks/useGetDashboardInformation';

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
    textAlign: 'right',
  },
});

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
  const classes = useStyles();
  const {
    roles,
    permissions,
    totalNFTCount24h,
    totalNFTPriceRevenue,
    topBuyers,
    mostViewed,
  } = useGetDashboardInformation();

  const isXSmall = useMediaQuery((theme: Theme) => 'max-width: 600px');
  const isSmall = useMediaQuery((theme: Theme) => 'max-width: 840px');

  return isXSmall ? (
    <div>
      <div style={styles.flexColumn as CSSProperties}>
        <Welcome />
        {(roles ? permissions.indexOf(roles['admin']) !== -1 : false) && (
          <>
            <CardWithIcon
              to="/"
              icon={EuroIcon}
              title="Total revenue"
              subtitle={`${totalNFTPriceRevenue} EUR`}
            />
            <div style={styles.singleCol}>
              <CardWithIcon
                to="/"
                icon={ShoppingCartRoundedIcon}
                title="Nb of sold nfts (24h)"
                subtitle={totalNFTCount24h.toString()}
              />
            </div>
            <VerticalSpacer />
          </>
        )}
        <CardWithIcon
          to="/"
          icon={PeopleAltRoundedIcon}
          title="Top buyers"
          subtitle={topBuyers ? topBuyers.length : 0 ?? 0}
        >
          <List>
            {topBuyers && topBuyers.length ? (
              topBuyers.map((user: any, index: number) => (
                <ListItem>
                  <a
                    className={classes.link}
                    href={
                      process.env.REACT_APP_STORE_BASE_URL +
                      `/profile/${user?.userAddress}`
                    }
                    target="_blank"
                  >
                    <ListItemAvatar>
                      <Avatar src={user.userPicture} />
                    </ListItemAvatar>
                    <ListItemText primary={user.userName} />
                    <div className={classes.spacer} />
                    <ListItemText
                      primary={`${user.totalPaid} ꜩ`}
                      className={classes.alignRight}
                    />
                  </a>
                </ListItem>
              ))
            ) : (
              <div
                style={{
                  minHeight: '5rem',
                  height: '100%',
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: '#949494',
                }}
              >
                No Data
              </div>
            )}
          </List>
        </CardWithIcon>
      </div>
    </div>
  ) : isSmall ? (
    <div style={styles.flexColumn as CSSProperties}>
      <div style={styles.singleCol}>
        <Welcome />
      </div>
      {(roles ? permissions.indexOf(roles['admin']) !== -1 : false) && (
        <>
          <CardWithIcon
            to="/"
            icon={EuroIcon}
            title="Total revenue"
            subtitle={`${totalNFTPriceRevenue} EUR`}
          />
          <div style={styles.singleCol}>
            <CardWithIcon
              to="/"
              icon={ShoppingCartRoundedIcon}
              title="Nb of sold nfts (24h)"
              subtitle={totalNFTCount24h.toString()}
            />
          </div>
          <VerticalSpacer />
        </>
      )}

      <CardWithIcon
        to="/"
        icon={PeopleAltRoundedIcon}
        title="Top buyers"
        subtitle={topBuyers ? topBuyers.length : 0 ?? 0}
      >
        <List>
          {topBuyers && topBuyers.length ? (
            topBuyers.map((user: any, index: number) => (
              <ListItem>
                <a
                  className={classes.link}
                  href={
                    process.env.REACT_APP_STORE_BASE_URL +
                    `/profile/${user?.userAddress}`
                  }
                  target="_blank"
                >
                  <ListItemAvatar>
                    <Avatar src={user.userPicture} />
                  </ListItemAvatar>
                  <ListItemText primary={user.userName} />
                  <div className={classes.spacer} />
                  <ListItemText
                    primary={`${user.totalPaid} ꜩ`}
                    className={classes.alignRight}
                  />
                </a>
              </ListItem>
            ))
          ) : (
            <div
              style={{
                minHeight: '5rem',
                height: '100%',
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: '#949494',
              }}
            >
              No Data
            </div>
          )}
        </List>
      </CardWithIcon>
    </div>
  ) : (
    <>
      <Welcome />
      <div style={styles.flex}>
        <div style={styles.leftCol}>
          {(roles ? permissions.indexOf(roles['admin']) !== -1 : false) && (
            <>
              <CardWithIcon
                to="/"
                icon={EuroIcon}
                title="Total revenue"
                subtitle={`${totalNFTPriceRevenue} EUR`}
              />
              <div style={styles.singleCol}>
                <CardWithIcon
                  to="/"
                  icon={ShoppingCartRoundedIcon}
                  title="Nb of sold nfts (24h)"
                  subtitle={totalNFTCount24h.toString()}
                />
              </div>
              <VerticalSpacer />
            </>
          )}

          <CardWithIcon
            to=""
            icon={InsertPhotoIcon}
            title="Most viewed"
            subtitle={mostViewed ? mostViewed.length : 0 ?? 0}
          >
            <ListNftThumbnail nfts={mostViewed ?? []} />
            {!mostViewed ||
              (mostViewed && mostViewed.length === 0 && (
                <div
                  style={{
                    minHeight: '5rem',
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: '#949494',
                  }}
                >
                  No Data
                </div>
              ))}
          </CardWithIcon>
        </div>
        <div style={styles.rightCol}>
          <div style={styles.flex}>
            <CardWithIcon
              to="/"
              icon={PeopleAltRoundedIcon}
              title="Top buyers"
              subtitle={topBuyers ? topBuyers.length : 0 ?? 0}
            >
              <List>
                {topBuyers && topBuyers.length ? (
                  topBuyers.map((user: any, index: number) => (
                    <ListItem>
                      <a
                        className={classes.link}
                        href={
                          process.env.REACT_APP_STORE_BASE_URL +
                          `/profile/${user?.userAddress}`
                        }
                        target="_blank"
                      >
                        <ListItemAvatar>
                          <Avatar src={user.userPicture} />
                        </ListItemAvatar>
                        <ListItemText primary={user.userName} />
                        <div className={classes.spacer} />
                        <ListItemText
                          primary={`${user.totalPaid} ꜩ`}
                          className={classes.alignRight}
                        />
                      </a>
                    </ListItem>
                  ))
                ) : (
                  <div
                    style={{
                      minHeight: '5rem',
                      height: '100%',
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      color: '#949494',
                    }}
                  >
                    No Data
                  </div>
                )}
              </List>
            </CardWithIcon>
          </div>
        </div>
      </div>
    </>
  );
};
