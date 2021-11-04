import styled from '@emotion/styled';
import Avatar from '../../atoms/Avatar';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';

import { FC } from 'react';
import { CustomBadge } from '../../atoms/Badge';
import { Typography } from '../../atoms/Typography';
import { Menu, MenuProps, MenuItem, Stack, Theme } from '@mui/material';


interface ProfilePopoverProps extends MenuProps {
    avatarSrc?: string;
    userName?: string;
    history: any;
    notifications?: number;
    logOut: () => void;
}


const StyledMenuItem = styled(MenuItem)`
    margin-left: 0.5em !important;
    margin-right: 0.5em !important;
    padding-left: 0.5em;
    border-radius: 1em;
`

const paperProps = {
    sx: {
        borderRadius: '1.5em',
        overflow: 'visible',
        border: 'none',
        filter: 'drop-shadow(0px 0px 6px #5c5c5c2d)',
        boxShadow: 'none',
        top: '6rem !important',
        left: 'initial !important',
        right: '0px !important',
        width: '14em',
        height: '12em',
        paddingTop: '0.5em',
        transformOrigin: '200px -20px 0px !important',
        paddingBottom: '0.5em',
        mt: 1.5,
            '& .MuiAvatar-root': {
                width: 40,
                height: 40,
                ml: 0.5,
                mr: 2.5,
            },
            '& .MuiSvgIcon-root': {
                width: '75%',
                height: '75%'
            }

        },
}

const StyledMenu = styled(Menu)<{theme?: Theme}>`
    .MuiPaper-root {
        filter: ${props => props.theme.dropShadow.default};

        background-color: ${props => props.theme.palette.background.paper} !important;
        background-image: none !important;
    }
`

export const ProfilePopover : FC<ProfilePopoverProps> = ({...props}) => {
    
    const navigateTo = (path: string) => {
        props.history.push(path)
    }

    return (
        <StyledMenu
            anchorEl={props.anchorEl}
            open={props.open}
            onClose={props.onClose}
            onClick={props.onClick}
            PaperProps={paperProps}
            sx={{
                boxShadow: '',
                right: 50,
                top: 0,
                left: undefined,
            }}
        >
            <Stack spacing={1}>
                <StyledMenuItem onClick={() => navigateTo(`/profile/${props.userName}`)}>
                    <Avatar src={props.avatarSrc} /> 
                    <Typography size="inherit" weight="SemiBold"> Go to profile </Typography>
                </StyledMenuItem>
            
                <StyledMenuItem onClick={() => navigateTo('/notifications')}>
                    {
                        props.notifications ?
                            <CustomBadge color="error" badgeContent={props.notifications} max={99}>
                                <Avatar>
                                    <NotificationsRoundedIcon />
                                </Avatar> 
                            </CustomBadge>
                        :
                            <Avatar>
                                <NotificationsRoundedIcon />
                            </Avatar> 
                    }
                    <Typography size="inherit" weight="Medium"> Notifications </Typography>
                </StyledMenuItem>
                
                <StyledMenuItem onClick={() => props.logOut()}>
                    <Avatar>
                        <LogoutRoundedIcon sx={{'&.MuiSvgIcon-root': { marginLeft: 0.5, height: '65%', width: '60%'}}} />
                    </Avatar> 
                    <Typography size="inherit" weight="Medium"> Sign out </Typography>
                </StyledMenuItem>
            </Stack>
        </StyledMenu>
    )
}