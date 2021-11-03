import styled from '@emotion/styled';
import Avatar from '../../atoms/Avatar';
import ProfilePopover from '../ProfilePopover';
import FlexSpacer from '../../atoms/FlexSpacer';
import Brightness3Icon from '@mui/icons-material/Brightness3';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';

import { FC, useEffect, useState } from 'react';
import { KukaiEmbed } from 'kukai-embed';
import { NavLink, useHistory, useLocation } from 'react-router-dom';
import { Stack, Theme } from '@mui/material';
import { CustomBadge } from '../../atoms/Badge';
import { CustomButton } from '../../atoms/Button';
import { Typography } from '../../atoms/Typography';
import { QuickSearch } from '../../molecules/QuickSearch';
import { IUser } from '../../../interfaces/user';


interface MenuProps {
    user?: IUser;
    loading?: boolean;
    embedKukai?: KukaiEmbed;
    selectedTheme: string;
    switchTheme: Function;
    notifications?: number;
    isSearchOpen: boolean;
    setSearchOpen: Function;
    history: any;
    onLogout?: () => void;
    onCreateAccount?: () => void;
}

const StyledMenuStack = styled(Stack)`
    align-items: end !important;

    @media (max-width: 1100px) {
        right: 0rem;
        padding-left: 0rem;
    }

    @media (max-width: 730px) {
        height: 3rem;
        padding-left: 0rem;
        transition: padding-left 0.2s;
        width: 100%;
    }
`

interface SearchProps {
    theme?: Theme
    isSearchOpen?: boolean;
}

const StyledLink = styled(NavLink)<SearchProps>`
    color: ${props => props.theme.palette.text.primary};
    text-decoration: none;

    display: ${props => props.isSearchOpen ? 'none' : 'flex'};

    @media (max-width: 1100px) {
        height: 2rem;
    }
    
    &.active {
        p {
            font-family: 'Open Sans Medium' !important;
            color: ${props => props.theme.palette.text.primary} !important;
        }
    }
`

const WrapperThemeIcon = styled.div<SearchProps>`
    display: ${props => props.isSearchOpen ? 'none' : 'flex'};
`

interface MenuIconProps {
    expandMenu?: boolean;
    theme?: Theme;
}

const WrapperMenuIcon = styled.div<MenuIconProps>`
    height: 40px;
    width: 40px;
    border-radius: 2rem;
    
    background-color: ${props => props.theme.palette.background.paper };
    filter: ${props => props.theme.dropShadow.default };
    transition: filter 0.2s;

    display: flex;
    align-items: center;
    justify-content: center;

    transition: all 500ms cubic-bezier(0, .61, .28, .92);
    transition-property: all;
    transition-property: opacity, transform, visibility, filter;

    &:hover {
        filter: ${props => props.theme.dropShadow.hover };
        transition: filter 0.2s;
    }
`

const StyledMenuCloser = styled.div<MenuIconProps>`
    display: ${props => props.expandMenu ? 'flex' : 'none'};
    position: absolute;
    top: 0;
    left: 0;
    height: 100vh;
    width: 100vw;
`

const MenuBarUp = styled.div<MenuIconProps>`
    background: ${props => props.theme.palette.text.primary};
    border-radius: 3px;
    height: 3px;
    transform: none;
    transform-origin: left;
    transition: transform 500ms cubic-bezier(0, .61, .28, .92);
    width: 22px;
    transform: ${props => props.expandMenu ? 'rotate(45deg) translateY(-4.8px)' : undefined};
`

const MenuBarDown = styled.div<MenuIconProps>`
    background: ${props => props.theme.palette.text.primary};
    border-radius: 3px;
    height: 3px;
    transform: none;
    transform-origin: left;
    transition: transform 500ms cubic-bezier(0, .61, .28, .92);
    width: 22px;
    transform: ${props => props.expandMenu ? 'rotate(-45deg) translateY(-4.5px) translateX(4.5px)' : undefined};
    margin-top: 8px;
    transform-origin: center;
`

const MenuBarWrapper = styled.div`
    height: auto;
    display: inline-table;
`

const MobileStyledMenuHeader = styled(Stack)<SearchProps>`
    display: none;
    margin-top: 0rem !important;

    @media (max-width: 1099px) {
        display: flex;
        align-items: center;
        height: 6rem;
        padding-right: 0.5rem;
        width: ${props => props.isSearchOpen ? "100%" : "" };
    }

    @media (max-width: 730px) {
        display: flex;
        align-items: center;
        padding-right: 0rem;
        height: 4rem;
        width: ${props => props.isSearchOpen ? "100%" : "" };
    }
`

const MobileStyledMenuContent = styled(Stack)<MenuIconProps>`
   display: none;

   @media (max-width: 1100px) {
        display: flex;
        height: ${props => props.expandMenu ? 'auto': '0%'};
        opacity: ${props => props.expandMenu ? '1' : '0'};      
        width: auto;

        position: fixed;
        top: 5em; 
        left: 0;
        right: 0;
       
        z-index: 5;
        transition: 0.3s;

        padding-right: 2rem;
        padding-left: 2rem;
        padding-bottom: 1rem;

        padding-top: 2rem !important;
        margin-top: 1rem !important;
        background-color: ${props => props.theme.palette.background.default };
    }

`

const DesktopMenuContent = styled(Stack)`
    display: none;
    
    @media (min-width: 1100px) {
        display: flex;
    }
`

export const Menu : FC<MenuProps> = ({user, selectedTheme, onLogout, onCreateAccount, switchTheme, ...props}) => {

    const history = useHistory()
    const location = useLocation()

    const navigateTo = (componentURL: string) => {
        props.history.push(`/${componentURL}`)
    }

    const [avatarSrc, setAvatarSrc] = useState<string>('')

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [expandMenu, setExpandMenu] = useState(false)

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    useEffect(() => {
        if (user) {
            setAvatarSrc(user.profilePicture)
        }
    }, [user])

    return (
        <>
            <StyledMenuStack direction={{xs: 'column', sm: 'column', md: 'row' }} spacing={4} sx={{display: 'flex', alignItems: 'center'}} >
                
                {/* Closer div for mobile menu */}

                <StyledMenuCloser onClick={() => setExpandMenu(false)} expandMenu={expandMenu}>
                </StyledMenuCloser>

                {/* Mobile Menu Header */}
                
                <MobileStyledMenuHeader direction={'row'} spacing={2} isSearchOpen={props.isSearchOpen}>
                    
                    {/* QuickSearch wrapper to close menu in case open */}
                    
                    <div onClick={() => setExpandMenu(false)}>
                        <QuickSearch setSearchOpen={props.setSearchOpen} />
                    </div>
                    
                    {/* Menu button, and closing button for search bar */}

                    <WrapperMenuIcon onClick={props.isSearchOpen ? () => props.setSearchOpen(false) : () => setExpandMenu(!expandMenu)}>
                        <MenuBarWrapper>
                            <MenuBarUp expandMenu={props.isSearchOpen ? props.isSearchOpen : expandMenu } />
                            <MenuBarDown expandMenu={props.isSearchOpen ? props.isSearchOpen : expandMenu} />
                        </MenuBarWrapper>
                    </WrapperMenuIcon>
                    
                    <WrapperThemeIcon isSearchOpen={props.isSearchOpen}>
                        {
                            selectedTheme === 'dark' ?
                                <Brightness3Icon onClick={() => switchTheme('light')} sx={{cursor: 'pointer', bottom: 0}}/>
                            :
                                <WbSunnyOutlinedIcon onClick={() => switchTheme('dark')} sx={{cursor: 'pointer',  bottom: 0}}/> 
                        }
                    </WrapperThemeIcon>
                </MobileStyledMenuHeader>
                
                {/* Mobile Menu Content */}

                <MobileStyledMenuContent expandMenu={expandMenu} direction="column" spacing={2} sx={{alignItems: 'beginning'}}>
                    
                    <StyledLink to='/store' >
                        <Typography size="h2" weight="Bold" color='#9b9b9b' sx={{cursor: 'pointer'}}> Store </Typography>
                    </StyledLink>

                    <FlexSpacer borderBottom={false} minHeight={2}/>

                    {/* Call to action button: `Sign in` and `Add artwork` for curators and artists */}

                    {
                        // add localStorage.getItem in a useState hook to get the state after signning in.
                        localStorage.getItem('Kanvas - address') === user?.userName ?
                            user?.role === 'creator' ?
                                <CustomButton size="medium" onClick={onLogout} label="Add artwork" />
                            : 
                                undefined
                        : 
                            <CustomButton size="medium" onClick={() => navigateTo('sign-in')} label="Sign in" />
                    }
                    
                    <FlexSpacer borderBottom={true}/>
                    
                    {/* Sub menu to navigate to personnal pages such as notifications profile or simply to logout */}

                    {
                        localStorage.getItem('Kanvas - address') === user?.userName ? 
                            <>
                                <Stack direction="row" sx={{alignItems: "center"}} spacing={3}>
                                    <Avatar src={`${avatarSrc}?${Date.now()}`} sx={{cursor: 'pointer !important'}} />
                                    <Typography size="inherit" weight="Medium"> Go to profile </Typography>
                                </Stack>

                                <Stack direction="row" spacing={3}>
                                    <CustomBadge color="error" badgeContent={props.notifications} max={99} profile={true}>
                                        <Avatar>
                                            <NotificationsRoundedIcon />
                                        </Avatar> 
                                    </CustomBadge>
                                    <Typography size="inherit" weight="Medium"> Notifications </Typography>
                                </Stack>

                                <Stack direction="row" spacing={3} onClick={onLogout}>
                                    <Avatar>
                                        <LogoutRoundedIcon sx={{'&.MuiSvgIcon-root': { marginLeft: 0.5, height: '65%', width: '60%'}}} />
                                    </Avatar> 
                                    <Typography size="inherit" weight="Medium"> Sign out </Typography>
                                </Stack>
                            </>
                        :
                            undefined
                    }

                    
                </MobileStyledMenuContent>

                {/* Desktop Menu */}

                <DesktopMenuContent  direction={{xs: 'column', sm: 'column', md: 'row' }} spacing={4} sx={{display: 'flex', alignItems: 'center'}}>
                    
                    {/* Link to general pages */}

                    {
                        location.pathname === '/sign-in' || location.pathname === '/account/create' ?
                            undefined
                        :
                            <>
                                <StyledLink to='/store' isSearchOpen={props.isSearchOpen}>
                                    <Typography size="inherit" weight="Light" color='#9b9b9b' sx={{cursor: 'pointer'}}> Store </Typography>
                                </StyledLink>
                                
                                {/* Quick Search controlling the opacity and position of the links above */}

                                <QuickSearch setSearchOpen={props.setSearchOpen}/>
                            </>
                    }
                    
                
                    {/* Call to action button: `Sign in`, `Add artwork` for curators and artists, and profile avatar to display the submenu */}

                    {
                        localStorage.getItem('Kanvas - address') === user?.userName ?
                            user?.role === 'collector' ? 
                                <CustomBadge color="error" badgeContent={props.notifications} max={99} profile={true}>
                                    <Avatar src={`${avatarSrc}?${Date.now()}`} onClick={(e) => anchorEl === null ? handleClick(e) : handleClose()} sx={{cursor: 'pointer !important'}}/>
                                </CustomBadge>
                            :
                                <>
                                    <CustomButton size="medium" onClick={onLogout} label="Add artwork" />
                                    <CustomBadge color="error" badgeContent={props.notifications} max={99} profile={true}>
                                        <Avatar src={`${avatarSrc}?${Date.now()}`} onClick={(e) => anchorEl === null ? handleClick(e) : handleClose()} sx={{cursor: 'pointer !important'}}/>
                                    </CustomBadge>
                                </>
                        :
                            location.pathname === '/sign-in' || location.pathname === '/account/create' || location.pathname === '/account/edit' ?
                                undefined                                
                            :
                                <CustomButton size="medium" onClick={() => navigateTo('sign-in')} label="Sign in" loading={props.loading}/>
                    }

                    {
                        selectedTheme === 'dark' ?
                            <Brightness3Icon onClick={() => switchTheme('light')} sx={{cursor: 'pointer'}}/>
                        :
                            <WbSunnyOutlinedIcon onClick={() => switchTheme('dark')} sx={{cursor: 'pointer'}}/>
                    }
                </DesktopMenuContent>

            </StyledMenuStack>

            <ProfilePopover
                open={Boolean(anchorEl)}
                avatarSrc={`${avatarSrc}?${Date.now()}`}
                userName={user?.userName}
                history={history}
                notifications={props.notifications}
                logOut={() => console.log('logging out')}
                onClose={handleClose}
                onClick={handleClose}
            />
        </>       
    )
}