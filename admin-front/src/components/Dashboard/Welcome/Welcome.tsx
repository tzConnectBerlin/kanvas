
import HomeIcon from '@mui/icons-material/Home';
import UsersIcon from '@mui/icons-material/Group';

import { makeStyles } from '@material-ui/core/styles';
import { Box, Card, CardActions, Button, Typography } from '@material-ui/core';

const useStyles = makeStyles(theme => ({
    root: {
        boxShadow: '2px 4px 10px #c4c4c4 !important',
        borderRadius: '1rem',
        background:
            theme.palette.type === 'dark'
                ? '#535353'
                : `linear-gradient(to right, #8975fb 0%, #746be7 35%), linear-gradient(to bottom, #8975fb 0%, #6f4ceb 50%), #6f4ceb`,

        color: '#fff',
        padding: 20,
        marginTop: theme.spacing(2),
        marginBottom: '2rem',
    },
    media: {
        background: `url('/images/welcome_illustration.png') top right /  100% no-repeat`,
        marginLeft: 'auto',
        height: '15rem'
    },
    boxWrapper: {
        display: 'flex',
        flexDirection: 'column',
    },
    actions: {
        [theme.breakpoints.down('md')]: {
            padding: 0,
            flexWrap: 'wrap',
            '& a': {
                marginTop: '1em',
                marginLeft: '0!important',
                marginRight: '1em',
            },
        },
    },
    spacer: {
        flexGrow: 1,
    }
}));

export const Welcome = () => {
    const classes = useStyles();

    const projectName = "Kanvas";

    return (
        <Card className={classes.root}>
            <Box display="flex">
                <Box flex="1" className={classes.boxWrapper}>
                    <Typography variant="h2" component="h1" gutterBottom>
                        Welcome to {projectName} Admin
                    </Typography>
                    <Box maxWidth="40em">
                        <Typography variant="body1" component="p" gutterBottom>
                            Here you are able to manage your stats
                        </Typography>
                    </Box>
                    <div className={classes.spacer} />
                    <CardActions className={classes.actions}>
                        <Button
                            variant="contained"
                            href="/"
                            className='MuiButton-containedPrimary'
                            startIcon={<HomeIcon />}
                        >
                           Home
                        </Button>
                        <Button
                            variant="contained"
                            href="/user"
                            className='MuiButton-containedPrimary'
                            startIcon={<UsersIcon />}
                        >
                           Users
                        </Button>
                    </CardActions>
                </Box>

                <Box
                    display={{ xs: 'none', sm: 'none', md: 'block' }}
                    className={classes.media}
                    width="20em"
                    height="20em"
                    overflow="hidden"
                />
            </Box>
        </Card>
    );
};