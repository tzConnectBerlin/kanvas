import styled from '@emotion/styled'
import Avatar from '../../../atoms/Avatar'
import FlexSpacer from '../../../atoms/FlexSpacer'
import Brightness3Icon from '@mui/icons-material/Brightness3'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined'

import { FC, useEffect, useState } from 'react'
import { Stack, Theme } from '@mui/material'
import { CustomButton } from '../../../atoms/Button'
import { Typography } from '../../../atoms/Typography'
import {
    MenuProps,
    SearchProps,
    StyledShoppingCartRoundedIcon,
    StyledLink,
} from '../Menu'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { Box } from '@mui/system'

const WrapperThemeIcon = styled.div<SearchProps>`
    display: ${(props) => (props.isSearchOpen ? 'none' : 'flex')};
`

interface MenuIconProps {
    expandMenu?: boolean
    theme?: Theme
}

const WrapperMenuIcon = styled.div<MenuIconProps>`
    height: 2.5rem;
    width: 2.5rem;

    cursor: pointer;

    background-color: ${(props) => props.theme.palette.background.paper};
    outline: ${(props) => `solid 1px ${props.theme.palette.text.primary}`};
    transition: filter 0.2s;

    display: flex;
    align-items: center;
    justify-content: center;

    transition: all 500ms cubic-bezier(0, 0.61, 0.28, 0.92);
    transition-property: all;
    transition-property: opacity, transform, visibility, filter;

    &:hover {
        cursor: pointer;
        outline: ${(props) => `solid 2px ${props.theme.palette.text.primary}`};
        transition: filter 0.2s;
    }
`

const StyledMenuCloser = styled.div<MenuIconProps>`
    display: ${(props) => (props.expandMenu ? 'flex' : 'none')};
    position: absolute;
    top: 0;
    left: 0;
    height: 100vh;
    width: 100vw;
`

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
`

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
`

const MenuBarWrapper = styled.div`
    height: auto;
    display: inline-table;
`

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

    @media (max-width: 730px) {
        display: flex;
        align-items: center;
        padding-right: 0rem;
        height: 4rem;
        width: ${(props) => (props.isSearchOpen ? '100%' : '')};
        margin-left: auto !important;
    }
`

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

        background-color: ${(props) => props.theme.palette.background.paper};
        opacity: 1;

        p,
        a {
            opacity: ${(props) => (props.expandMenu ? 1 : 0)} !important;
            transition: opacity 0.3s;
        }

        transition: max-width 0.3s, width 0.3s, padding 0.5s;
    }

    @media (max-width: 1100px) {
        width: ${(props) => (props.expandMenu ? 40 : 0)}%;
    }

    @media (max-width: 730px) {
        width: ${(props) => (props.expandMenu ? 50 : 0)}%;
    }

    @media (max-width: 650px) {
        width: ${(props) => (props.expandMenu ? 100 : 0)}%;
    }
`

const StyledBox = styled.div`
    @media (max-width: 874px) {
        display: flex;
        flex-direction: column;
        padding: 0 1.5rem;
        height: 100%;
    }
`

export const MobileMenu: FC<MenuProps> = ({ ...props }) => {
    const { t } = useTranslation(['translation'])
    const history = useHistory()

    const [expandMenu, setExpandMenu] = useState(false)

    // const navigateTo = (componentURL: string) => {
    //     history.push(`/${componentURL}`)
    // }

    useEffect(() => {
        if (expandMenu) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'auto'
        }
    }, [expandMenu])

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
            >
                {/* QuickSearch wrapper to close menu in case open */}

                {/* <div onClick={() => setExpandMenu(false)}>
                        <QuickSearch setSearchOpen={props.setSearchOpen} />
                    </div> */}

                {/* Menu button, and closing button for search bar */}

                <WrapperMenuIcon
                    onClick={
                        props.isSearchOpen
                            ? () => props.setSearchOpen(false)
                            : () => setExpandMenu(!expandMenu)
                    }
                >
                    <MenuBarWrapper>
                        <MenuBarUp
                            expandMenu={
                                props.isSearchOpen
                                    ? props.isSearchOpen
                                    : expandMenu
                            }
                        />
                        <MenuBarDown
                            expandMenu={
                                props.isSearchOpen
                                    ? props.isSearchOpen
                                    : expandMenu
                            }
                        />
                    </MenuBarWrapper>
                </WrapperMenuIcon>

                <StyledShoppingCartRoundedIcon
                    onClick={() => props.openOrCloseShoppingCart()}
                />

                <WrapperThemeIcon isSearchOpen={props.isSearchOpen}>
                    {props.selectedTheme === 'dark' ? (
                        <Brightness3Icon
                            onClick={() => props.switchTheme('light')}
                            sx={{ cursor: 'pointer', bottom: 0 }}
                        />
                    ) : (
                        <WbSunnyOutlinedIcon
                            onClick={() => props.switchTheme('dark')}
                            sx={{ cursor: 'pointer', bottom: 0 }}
                        />
                    )}
                </WrapperThemeIcon>
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
                    <StyledLink to="/">
                        <Typography
                            size="h2"
                            weight="SemiBold"
                            color="#9b9b9b"
                            sx={{ cursor: 'pointer', marginBottom: '0.7rem' }}
                        >
                            {t('menu.home')}
                        </Typography>
                    </StyledLink>

                    <StyledLink to="/store">
                        <Typography
                            size="h2"
                            weight="SemiBold"
                            color="#9b9b9b"
                            sx={{ cursor: 'pointer' }}
                        >
                            {t('menu.store')}
                        </Typography>
                    </StyledLink>

                    <FlexSpacer borderBottom={false} minHeight={2} />

                    {/* Call to action button: `Sign in` and `Add artwork` for curators and artists */}

                    {
                        // add localStorage.getItem in a useState hook to get the state after signning in.
                        localStorage.getItem('Kanvas - address') ===
                            props.user?.address && (
                            <CustomButton
                                size="medium"
                                onClick={() => props.setOpen(true)}
                                label="Sign in"
                            />
                        )
                    }
                </StyledBox>
                <FlexSpacer borderBottom={false} />

                {/* Sub menu to navigate to personnal pages such as notifications profile or simply to logout */}

                {localStorage.getItem('Kanvas - address') ===
                props.user?.address ? (
                    <>
                        <Stack
                            direction="row"
                            sx={{ alignItems: 'center' }}
                            spacing={3}
                        >
                            <Avatar
                                // TODO: Add link to user profile
                                src={`?${Date.now()}`}
                                sx={{ cursor: 'pointer !important' }}
                            />
                            <Typography size="inherit" weight="Medium">
                                {' Go to profile '}
                            </Typography>
                        </Stack>

                        <Stack
                            direction="row"
                            spacing={3}
                            onClick={props.onLogout}
                        >
                            <Avatar>
                                <LogoutRoundedIcon
                                    sx={{
                                        '&.MuiSvgIcon-root': {
                                            marginLeft: 0.5,
                                            height: '65%',
                                            width: '60%',
                                        },
                                    }}
                                />
                            </Avatar>
                            <Typography size="inherit" weight="Medium">
                                {' '}
                                Sign out{' '}
                            </Typography>
                        </Stack>
                    </>
                ) : undefined}
            </MobileStyledMenuContent>
        </>
    )
}
