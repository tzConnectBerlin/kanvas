import styled from '@emotion/styled'
import MobileMenu from './MobileMenu'
import DesktopMenu from './DesktopMenu'
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded'

import { FC } from 'react'
import { NavLink } from 'react-router-dom'
import { Stack, Theme } from '@mui/material'
import { IUser } from '../../../interfaces/user'

export interface MenuProps {
    user?: IUser
    loading?: boolean
    setOpen: Function
    theme?: Theme
    selectedTheme: string
    switchTheme: Function
    isSearchOpen: boolean
    setSearchOpen: Function
    onLogout: () => void
    openOrCloseShoppingCart: Function
    nftsInCartNumber: number
}

const StyledMenuStack = styled(Stack)`
    align-items: end !important;

    @media (max-width: 875px) {
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

export interface SearchProps {
    theme?: Theme
    isSearchOpen?: boolean
}

export const StyledLink = styled(NavLink)<SearchProps>`
    color: ${(props) => props.theme.palette.text.primary};
    text-decoration: none;

    display: ${(props) => (props.isSearchOpen ? 'none' : 'flex')};

    @media (max-width: 875px) {
        height: 2rem;
    }

    &.active {
        p {
            font-family: 'Poppins Medium' !important;
            color: ${(props) => props.theme.palette.text.primary} !important;
        }
    }
`

export const StyledShoppingCartRoundedIcon = styled(ShoppingCartRoundedIcon)`
    cursor: pointer;
`

export const Menu: FC<MenuProps> = ({
    user,
    selectedTheme,
    switchTheme,
    onLogout,
    ...props
}) => {
    return (
        <StyledMenuStack
            direction={{ xs: 'column', sm: 'column', md: 'row' }}
            spacing={4}
            sx={{ display: 'flex', alignItems: 'center' }}
        >
            <MobileMenu
                user={user}
                loading={props.loading}
                setSearchOpen={props.setSearchOpen}
                isSearchOpen={props.isSearchOpen}
                selectedTheme={selectedTheme}
                switchTheme={switchTheme}
                setOpen={props.setOpen}
                onLogout={onLogout}
                openOrCloseShoppingCart={props.openOrCloseShoppingCart}
                nftsInCartNumber={props.nftsInCartNumber}
            />
            {/* Desktop Menu */}
            <DesktopMenu
                user={user}
                loading={props.loading}
                setSearchOpen={props.setSearchOpen}
                isSearchOpen={props.isSearchOpen}
                selectedTheme={selectedTheme}
                switchTheme={switchTheme}
                setOpen={props.setOpen}
                onLogout={onLogout}
                openOrCloseShoppingCart={props.openOrCloseShoppingCart}
                nftsInCartNumber={props.nftsInCartNumber}
            />
        </StyledMenuStack>
    )
}
