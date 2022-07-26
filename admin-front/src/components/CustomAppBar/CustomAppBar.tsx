import * as React from 'react';
import { AppBar, MenuItemLink, useGetIdentity, UserMenu } from 'react-admin';
import { makeStyles } from '@material-ui/core/styles';

import { Link } from 'react-router-dom';
import { Settings } from "@mui/icons-material";

const useStyles = makeStyles({
  bar: {
    height: '4rem !important',
    display: 'flex',
    justifyContent: 'center',
  },
  spacer: {
    flex: 1,
  },
  link: {
    display: 'flex',
    alignItems: 'center',
  },
  logo: {
    width: '12.5rem',
    marginLeft: '1rem',
    marginRight: '1.5rem',
  }
});

const CustomUserMenu = (props: any) => {
  const { identity } = useGetIdentity();
  return (
    <UserMenu {...props} label={identity?.email}>
      <MenuItemLink to="/my-profile" primaryText="My profile" leftIcon={<Settings/>} />
    </UserMenu>
  );
}

export const CustomAppBar = (props: any) => {
  const classes = useStyles();
  return (
    <AppBar {...props} color="black" className={classes.bar}>
      <Link to="/" className={classes.link}>
        <img src='/Logo.svg' className={classes.logo} />
      </Link>
      <span className={classes.spacer} />
    </AppBar>
  );
};