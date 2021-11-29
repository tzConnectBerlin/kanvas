import styled from '@emotion/styled'
import { FlexSpacerProps } from '../../atoms/FlexSpacer'
import { Box } from '@mui/system'
import { FC, useEffect, useState } from 'react'
import { Theme } from '@mui/material'
import { KukaiEmbed } from 'kukai-embed'
import { StickyLogo } from '../../atoms/StickyLogo'
import { Menu } from '../../molecules/Menu'
import { IUser } from '../../../interfaces/user'
import useAxios from 'axios-hooks'
import { BeaconWallet } from '@taquito/beacon-wallet'
import { SignInModal } from '../../molecules/SignInModal'

export interface HeaderProps {
    user?: { role: string }
    theme?: Theme
    loading?: boolean
    beaconWallet?: BeaconWallet
    embedKukai?: KukaiEmbed
    setSignedPayload?: Function
    handleCloseModal?: Function
    selectedTheme: string
    notifications?: number
    switchTheme: Function
    onCreateAccount?: () => void
    cartOpen: boolean
    setCartOpen: Function
    nftsInCartNumber: number
    listCart: Function
}

const StyledBox = styled(Box)<{ theme?: Theme }>`
    margin-bottom: -6rem;
    color: ${(props) => props.theme.palette.text.primary};

    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);

    background-color: ${(props) => props.theme.header.background};
    position: sticky;
    top: 0;
    z-index: 10;
    transition: padding-left 0.2s, padding-right 0.2s;
    padding-left: 3rem;

    @media (max-width: 900px) {
        padding-left: 1.5rem;
        padding-right: 1rem !important;
        transition: padding-left 0.2s, padding-right 0.2s;
    }
`

const Spacer = styled.div<FlexSpacerProps>`
    flex-grow: 1;
    flex-grow: 1;
    width: ${(props) => (props.display ? '' : '0rem')};
    transition: width 0.2s;
`

export const Header: FC<HeaderProps> = ({
    user,
    selectedTheme,
    onCreateAccount,
    switchTheme,
    notifications,
    beaconWallet,
    embedKukai,
    setSignedPayload,
    listCart,
    ...props
}) => {
    const [open, setOpen] = useState(false)
    const handleCloseModal = () => setOpen(false)

    // const loggedUser = {data: undefined, loading: false}
    const [loggedUser] = useAxios({
        url: process.env.REACT_APP_API_SERVER_BASE_URL + '/auth/logged_user',
        withCredentials: true,
        headers: {
            Authorization: `Bearer ${localStorage.getItem('Kanvas - Bearer')}`,
        },
    })

    const [logoutUserResponse, logoutUser] = useAxios(
        {
            url: process.env.REACT_APP_API_SERVER_BASE_URL + '/auth/logout',
            method: 'POST',
            withCredentials: true,
            headers: {
                Authorization: `Bearer ${localStorage.getItem(
                    'Kanvas - Bearer',
                )}`,
            },
        },
        { manual: true },
    )

    const handleLogout = () => {
        logoutUser()
            .then((res) => {
                localStorage.removeItem('Kanvas - Bearer')
                localStorage.removeItem('Kanvas - address')

                listCart({
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                            'Kanvas - Bearer',
                        )}`,
                    },
                    withCredentials: true,
                })
            })
            .catch((err) => {

            })
    }

    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [currentLoggedUser, setCurrentLoggedUser] = useState<
        IUser | undefined
    >(undefined)

    useEffect(() => {
        if (loggedUser.data) {
            setCurrentLoggedUser(loggedUser.data)
        } else if (loggedUser.error) {
            localStorage.removeItem('Kanvas - Bearer')
            localStorage.removeItem('Kanvas - address')
        }
    }, [loggedUser])

    return (
        <StyledBox
            sx={{
                height: '5rem',
                display: 'flex',
                alignItems: 'center',
                paddingRight: '2rem',
            }}
        >
            <StickyLogo display={!isSearchOpen} />
            <Spacer display={!isSearchOpen} />

            <Menu
                loading={loggedUser.loading}
                user={currentLoggedUser}
                setSearchOpen={setIsSearchOpen}
                isSearchOpen={isSearchOpen}
                selectedTheme={selectedTheme}
                switchTheme={switchTheme}
                setOpen={setOpen}
                onLogout={handleLogout}
                openOrCloseShoppingCart={() =>
                    props.setCartOpen(!props.cartOpen)
                }
                nftsInCartNumber={props.nftsInCartNumber}
            />

            <SignInModal
                beaconWallet={beaconWallet}
                embedKukai={embedKukai}
                setCurrentLoggedUser={setCurrentLoggedUser}
                handleCloseModal={handleCloseModal}
                open={open}
                listCart={listCart}
            />
        </StyledBox>
    )
}
