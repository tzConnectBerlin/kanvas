import * as React from 'react';
import { FC, createElement } from 'react';
import { Card, Box, Typography, Divider } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Link } from 'react-router-dom';
import { ReactNode } from 'react';


interface Props {
    icon: FC<any>;
    to: string;
    title?: string;
    subtitle?: string | number;
    children?: ReactNode;
}

const useStyles = makeStyles(theme => ({
    card: {
        boxShadow: '2px 4px 10px #787878 !important',
        borderRadius: '1rem',
        minHeight: 52,
        display: 'flex',
        flexDirection: 'column',
        flex: '1',

        '& a': {
            textDecoration: 'none',
            color: 'inherit',
        },
    },
    main: (props: Props) => ({
        overflow: 'inherit',
        padding: 16,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        '& .icon': {
            color: theme.palette.type === 'dark' ? 'inherit' : '#9771ff',
        },
    }),
    title: {},
}));

export const CardWithIcon = (props: Props) => {
    const { icon, title, subtitle, to, children } = props;
    const classes = useStyles(props);
    return (
        <Card className={classes.card}>
            <Link to={to}>
                <div className={classes.main}>
                    <Box width="3em" className="icon">
                        {createElement(icon, { fontSize: 'large' })}
                    </Box>
                    <Box textAlign="right">
                        <Typography
                            className={classes.title}
                            color="textSecondary"
                        >
                            {title}
                        </Typography>
                        <Typography variant="h3" component="h2" style={{fontFamily: 'Poppins SemiBold', marginTop: '0.2rem'}}>
                            {subtitle || ' '}
                        </Typography>
                    </Box>
                </div>
            </Link>
            {children && <Divider />}
            {children}
        </Card>
    );
};