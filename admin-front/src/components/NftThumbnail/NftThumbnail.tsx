import * as React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Nft } from '../../type';
import { Grid, Typography } from '@mui/material';

const useStyles = makeStyles({
  root: {
    margin: '1em',
    zIndex: 2,
  },
  content: {
    padding: '1rem',
    '&:last-child': {
      padding: 0,
    },
    position: 'relative',
    transition: 'scale 0.2s',
    '&:hover': {
      scale: 1.05,
    },
    cursor: 'pointer',
  },
  img: {
    borderRadius: '0.5rem',
    minWidth: '100%',
    height: '10em',
    maxHeight: '13em',
    objectFit: 'cover',
    backgroundRepeat: 'no-repeat',
  },
  wrapperTitle: {
    borderRadius: '0.5rem',
    position: 'absolute',
    bottom: 0,
    paddingLeft: '1em',
    paddingBottom: '0.5em',
    background:
      'linear-gradient(to top, rgba(0,0,0,0.8) 0%,rgba(0,0,0,0.4) 70%,rgba(0,0,0,0) 100%)',
    width: '100%',
  },
  title: {
    fontFamily: 'Poppins SemiBold',
    color: 'white !important',
  },
  subtitle: {
    fontFamily: 'Poppins Light !important',
    color: 'white !important',
  },
});

export const NftThumbnail = (props: Nft) => {
  const classes = useStyles();

  return (
    <a
      href={process.env.REACT_APP_STORE_BASE_URL + `/product/${props.id}`}
      target="_blank"
    >
      <Grid container className={classes.content}>
        <img src={props.image} alt="" className={classes.img} />
        <Grid item className={classes.wrapperTitle}>
          <Typography variant="h6" component="h2" className={classes.title}>
            {props.name || ' '}
          </Typography>
          <Typography
            variant="subtitle2"
            component="h2"
            className={classes.subtitle}
          >
            {props.price || ' '} tez
          </Typography>
        </Grid>
      </Grid>
    </a>
  );
};
