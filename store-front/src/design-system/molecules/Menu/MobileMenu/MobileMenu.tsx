import styled from '@emotion/styled';
import Avatar from '../../../atoms/Avatar';
import Brightness3Icon from '@mui/icons-material/Brightness3';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';

import { FC, useEffect, useRef, useState } from 'react';
import {
    Badge,
    Slide,
    Stack,
    Theme,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import { CustomButton } from '../../../atoms/Button';
import { Typography } from '../../../atoms/Typography';
import { MenuProps, SearchProps, StyledShoppingCartRoundedIcon } from '../Menu';
import { useTranslation } from 'react-i18next';
import { Link, useHistory } from 'react-router-dom';
import { QuickSearch } from '../../QuickSearch';
import { ArrowBackIosNew } from '@mui/icons-material';

const WrapperThemeIcon = styled.div<SearchProps>`
    display: flex;
`;

interface MenuIconProps {
    expandMenu?: boolean;
    theme?: Theme;
}

interface BackButtonProps {
    theme?: Theme;
    isSearchOpen: boolean;
}

const WrapperMenuIcon = styled.div<MenuIconProps>`
    height: 2.2rem;
    width: 2.2rem;

    cursor: pointer;

    transition: filter 0.2s;

    display: flex;
    align-items: center;
    justify-content: center;

    transition: all 500ms cubic-bezier(0, 0.61, 0.28, 0.92);
    transition-property: all;
    transition-property: opacity, transform, visibility, filter;

    &:hover {
        cursor: pointer;
        transition: filter 0.2s;
    }
`;

const StyledMenuCloser = styled.div<MenuIconProps>`
    display: ${(props) => (props.expandMenu ? 'flex' : 'none')};
    position: absolute;
    top: 0;
    left: 0;
    height: 100vh;
    width: 100vw;
`;

const MenuBarUp = styled.div<MenuIconProps>`
    background: ${(props) => props.theme.palette.text.primary};
    border-radius: 3px;
    height: 3px;
    transform: none;
    transform-origin: left;
    transition: transform 500ms cubic-bezier(0, 0.61, 0.28, 0.92);
    width: 22px;
    transform: ${(props) =>
        props.expandMenu ? 'rotate(45deg) translateY(-4.8px)' : undefined};
`;

const MenuBarDown = styled.div<MenuIconProps>`
    background: ${(props) => props.theme.palette.text.primary};
    border-radius: 3px;
    height: 3px;
    transform: none;
    transform-origin: left;
    transition: transform 500ms cubic-bezier(0, 0.61, 0.28, 0.92);
    width: 22px;
    transform: ${(props) =>
        props.expandMenu
            ? 'rotate(-45deg) translateY(-4.5px) translateX(4.5px)'
            : undefined};
    margin-top: 8px;
    transform-origin: center;
`;

const MenuBarWrapper = styled.div`
    height: auto;
    display: inline-table;
`;

const MobileStyledMenuHeader = styled(Stack)<SearchProps>`
    display: none;
    margin-top: 0rem !important;

    @media (max-width: 874px) {
        display: flex;
        align-items: center;
        height: 6rem;
        padding-right: 0.5rem;
        width: ${(props) => (props.isSearchOpen ? '100%' : '')};
    }

    @media (max-width: 874px) {
        display: flex;
        align-items: center;
        padding-right: 0rem;
        height: 4rem;
        width: ${(props) => (props.isSearchOpen ? '100%' : '')};
        margin-left: auto !important;
        justify-content: space-between;
    }
`;

const MobileStyledMenuContent = styled(Stack)<MenuIconProps>`
    display: none;

    @media (max-width: 874px) {
        max-width: ${(props) => (props.expandMenu ? 25 : 0)}rem;
        width: ${(props) => (props.expandMenu ? 35 : 0)}%;
        display: flex;
        height: 100vh;
        position: fixed;
        left: 0;
        bottom: 0;
        z-index: 999999;
        top: 5rem;

        overflow: auto;

        margin-top: 0 !important;
        padding-top: 1.5rem !important;

        padding-bottom: 2.5rem;

        background-color: ${(props) => props.theme.palette.background.default};
        opacity: 1;

        p,
        a {
            opacity: ${(props) => (props.expandMenu ? 1 : 0)} !important;
            transition: opacity 0.3s;
        }

        transition: max-width 0.3s, width 0.3s, padding 0.5s;
    }

    @media (max-width: 1100px) {
        width: ${(props) => (props.expandMenu ? 50 : 0)}%;
    }
    @media (max-width: 600px) {
        width: ${(props) => (props.expandMenu ? 100 : 0)}%;
    }
`;

const StyledBox = styled.div`
    @media (max-width: 874px) {
        display: flex;
        flex-direction: column;
        padding: 0 1.5rem;
        height: 100%;
    }
`;

const StyledMobileLink = styled(Link)<{ theme?: Theme }>`
    color: ${(props) => props.theme.palette.text.primary};
    text-decoration: none;

    height: 2rem;
    margin-left: 0.5rem;
    margin-top: 0.5rem;
`;

const StyledSignIn = styled(Typography)`
    height: 2rem;
    margin-left: 0.5rem;
    margin-top: 0.5rem;
`;

const BackButton = styled(ArrowBackIosNew)<BackButtonProps>`
    fill: ${(props) => props.theme.palette.text.primary};
    z-index: 999;
    pointer-events: none;
    cursor: pointer;
    opacity: ${(props) => (props.isSearchOpen ? 1 : 0)};
    /* transition: opacity 0.2s; */
`;

const StyledWrapper = styled(Stack)`
    justify-content: center;
    align-items: center;
`;

const StyledBrightness3Icon = styled(Brightness3Icon)`
    @media (max-width: 874px) {
        height: 1.3rem;
    }
`;

const StyledWbSunnyOutlinedIcon = styled(WbSunnyOutlinedIcon)`
    @media (max-width: 874px) {
        height: 1.3rem;
    }
`;

export const MobileMenu: FC<MenuProps> = ({ ...props }) => {
    const { t } = useTranslation(['translation']);
    const history = useHistory();

    const [expandMenu, setExpandMenu] = useState(false);

    const navigateTo = (componentURL: string) => {
        history.push(componentURL);
    };

    useEffect(() => {
        if (expandMenu) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    }, [expandMenu]);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const wrapperRef = useRef();

    useEffect(() => {
        if (props.isSearchOpen && isMobile) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    }, [props.isSearchOpen, isMobile]);

    return (
        <>
            <StyledMenuCloser
                onClick={() => setExpandMenu(false)}
                expandMenu={expandMenu}
            />

            {/* Mobile Menu Header */}

            <MobileStyledMenuHeader
                direction={'row'}
                spacing={2}
                isSearchOpen={props.isSearchOpen}
                ref={wrapperRef}
                overflow={'hidden'}
                alignItems={'flex-end'}
            >
                <BackButton isSearchOpen={props.isSearchOpen} />

                {/* QuickSearch wrapper to close menu in case open */}

                <Stack
                    onClick={() =>
                        !props.isSearchOpen
                            ? props.setSearchOpen(!props.isSearchOpen)
                            : {}
                    }
                >
                    <QuickSearch
                        searchOpen={props.isSearchOpen}
                        setSearchOpen={props.setSearchOpen}
                    />
                </Stack>

                {/* Menu button, and closing button for search bar */}

                <Slide
                    direction="left"
                    in={!props.isSearchOpen}
                    container={wrapperRef.current}
                    style={{ marginLeft: '0.8rem' }}
                >
                    <StyledWrapper spacing={2} direction="row">
                        <Badge
                            color="error"
                            badgeContent={props.nftsInCartNumber}
                        >
                            <StyledShoppingCartRoundedIcon
                                onClick={() => props.openOrCloseShoppingCart()}
                            />
                        </Badge>

                        <WrapperThemeIcon isSearchOpen={props.isSearchOpen}>
                            {props.selectedTheme === 'dark' ? (
                                <StyledBrightness3Icon
                                    onClick={() => props.switchTheme('light')}
                                    sx={{ cursor: 'pointer', bottom: 0 }}
                                />
                            ) : (
                                <StyledWbSunnyOutlinedIcon
                                    onClick={() => props.switchTheme('dark')}
                                    sx={{ cursor: 'pointer', bottom: 0 }}
                                />
                            )}
                        </WrapperThemeIcon>
                        <WrapperMenuIcon
                            onClick={
                                props.isSearchOpen
                                    ? () => props.setSearchOpen(false)
                                    : () => setExpandMenu(!expandMenu)
                            }
                        >
                            <MenuBarWrapper>
                                <MenuBarUp expandMenu={expandMenu} />
                                <MenuBarDown expandMenu={expandMenu} />
                            </MenuBarWrapper>
                        </WrapperMenuIcon>
                    </StyledWrapper>
                </Slide>
            </MobileStyledMenuHeader>

            {/* Mobile Menu Content */}

            <MobileStyledMenuContent
                expandMenu={expandMenu}
                direction="column"
                spacing={2}
                sx={{ alignItems: 'beginning' }}
                onClick={() => setExpandMenu(!expandMenu)}
            >
                <StyledBox>
                    <Typography
                        size="h5"
                        weight="Medium"
                        color="#9b9b9b"
                        sx={{ cursor: 'pointer', marginBottom: '0.7rem' }}
                    >
                        Menu
                    </Typography>
                    <StyledMobileLink to="/">
                        <Typography
                            size="h2"
                            weight="SemiBold"
                            sx={{ cursor: 'pointer', marginBottom: '0.7rem' }}
                        >
                            {t('menu.home')}
                        </Typography>
                    </StyledMobileLink>

                    <StyledMobileLink to="/store">
                        <Typography
                            size="h2"
                            weight="SemiBold"
                            sx={{ cursor: 'pointer' }}
                        >
                            {t('menu.store')}
                        </Typography>
                    </StyledMobileLink>

                    <Typography
                        size="h5"
                        weight="Medium"
                        color="#9b9b9b"
                        sx={{
                            cursor: 'pointer',
                            marginBottom: '0.7rem',
                            marginTop: '1rem',
                        }}
                    >
                        User
                    </Typography>

                    {localStorage.getItem('Kanvas - address') !==
                        props.user?.userAddress && (
                        <StyledSignIn
                            size="h2"
                            weight="SemiBold"
                            sx={{ cursor: 'pointer' }}
                            onClick={() => props.setOpen(true)}
                        >
                            Sign in
                        </StyledSignIn>
                    )}

                    {localStorage.getItem('Kanvas - address') ===
                        props.user?.userAddress && (
                        <>
                            <Stack
                                direction="row"
                                sx={{
                                    alignItems: 'center',
                                    marginBottom: '0.7rem',
                                }}
                                spacing={3}
                            >
                                <Typography
                                    size="h2"
                                    weight="SemiBold"
                                    noWrap
                                    sx={{
                                        display: 'initial',
                                        cursor: 'pointer',
                                        marginLeft: '0.5rem',
                                    }}
                                    onClick={() =>
                                        navigateTo(
                                            `/profile/${props.user?.userAddress}`,
                                        )
                                    }
                                >
                                    Go to profile
                                </Typography>
                                <Avatar
                                    // TODO: Add link to user profile
                                    src={`${
                                        props.user?.profilePicture
                                    }?${Date.now()}`}
                                    sx={{ cursor: 'pointer !important' }}
                                />
                            </Stack>

                            <Typography
                                size="h2"
                                weight="SemiBold"
                                sx={{
                                    cursor: 'pointer',
                                    marginBottom: '0.7rem',
                                    marginLeft: '0.5rem',
                                }}
                                onClick={() => props.onLogout()}
                            >
                                Sign out
                            </Typography>
                        </>
                    )}
                </StyledBox>

                {/* Sub menu to navigate to personnal pages such as notifications profile or simply to logout */}
            </MobileStyledMenuContent>
        </>
    );
};
