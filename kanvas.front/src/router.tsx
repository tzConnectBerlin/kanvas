import SignIn from './pages/SignIn';
import styled from '@emotion/styled';
import Account from './pages/Account';
import Profile from './pages/Profile';
import Browse from './pages/Browse/index';
import StorePage from './pages/StorePage';
import Notifications from './pages/Notifications';
import AuctionsAndSales from './pages/Auctions&Sales/index';

import { RPC_URL } from './global';
import { Theme } from '@mui/material';
import { useEffect, useState } from 'react';
import { initTezos, initWallet } from './contracts/init';
import { darkTheme, lightTheme } from './theme';
import { KukaiEmbed, Networks } from 'kukai-embed';
import { responsiveFontSizes, ThemeProvider } from '@mui/material/styles';
import { Header } from './design-system/organismes/Header';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { BeaconWallet } from '@taquito/beacon-wallet';
import { INotification, NotificationEnum, CurrencyEnum } from './interfaces/notification';


const StyledBrowserRouter = styled(BrowserRouter)<{theme?: Theme}>`
    #root {
        background-color: ${props => props.theme.palette.background.default};
    }
`

const notifications: INotification[] = [
    {
        date: new Date(),
        description: 'is now following you.',
        concernedUser: {
            userName: 'tristan_ncl',
            firstName: 'Aurélia',
            lastName: 'Durand',
            profilePicture: '',
            address: ''
        },
        read: false,
        type: NotificationEnum.FOLLOWING
    },
    {
        date: new Date(new Date().getTime() - 600000),
        description: 'is now following you.',
        concernedUser: {
            userName: 'tristan_ncl_1',
            firstName: 'Tristan',
            lastName: 'Nicolaides',
            profilePicture: 'https://dart-creator-image-storage.fra1.digitaloceanspaces.com/tristan_ncl_1_picture',
            address: ''
        },
        read: false,
        type: NotificationEnum.FOLLOWING
    },
    {
        date: new Date(new Date().getTime() - 60000000),
        description: 'was successfully created.',
        concernedUser: {
            userName: 'tristan_ncl',
            firstName: 'Tristan',
            lastName: 'Nicolaides',
            profilePicture: '',
            address: ''
        },
        concernedNft: {
            title: 'Ricard boat',
            url: 'https://d-art.mypinata.cloud/ipfs/QmadzrA85X821PkrTF3DGCqk3mXEz9fwm5G3UL7V1vUoju'
        },
        read: false,
        type: NotificationEnum.NFT_CREATION
    },
    {
        date: new Date(new Date().getTime() - 6000000000),
        description: 'Hei',
        concernedUser: {
            userName: 'tristan_ncl',
            firstName: 'Tristan',
            lastName: 'Nicolaides',
            profilePicture: '',
            address: ''
        },
        concernedNft: {
            title: 'FirstNft',
            url: 'https://d-art.mypinata.cloud/ipfs/QmZuhoTWFoGfAwRj2nJxfsLb6DNkiPBsWmvNDtfFvncg87'
        },
        saleInfo: {
            type: 'drop',
            price: 100,
            sellerPrice: 72.5,
            currency: CurrencyEnum.TEZ
        },
        read: false,
        type: NotificationEnum.NFT_GOT_SOLD
    }
]

const Router = () => {

    const [embedKukai, setEmbedKukai] = useState<KukaiEmbed>();
    const [beaconWallet, setBeaconWallet] = useState<BeaconWallet>()
    const[ signedPayload, setSignedPayload] = useState('')
  
    const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark'>(localStorage.getItem('d /a:rt/ : theme') as "light" | "dark")

    const darkThemeResponsive = responsiveFontSizes(darkTheme);
    const lightThemeResponsive = responsiveFontSizes(lightTheme);

    useEffect(() => {
        if (!embedKukai) {
            setEmbedKukai(new KukaiEmbed({
                net: Networks.dev ,
                icon: false
            }))
        }
    }, [])

    useEffect(() => {
        initTezos(RPC_URL)
        setBeaconWallet(initWallet())
        
    }, [])

    const handleSelectTheme = (themeName: 'dark' | 'light') => {
        setSelectedTheme(themeName)
        localStorage.setItem('d /a:rt/ : theme', themeName)
    }

    return(
        <ThemeProvider theme={localStorage.getItem('d /a:rt/ : theme') === 'dark' ? darkThemeResponsive : lightThemeResponsive } >
            <StyledBrowserRouter>
                <Header embedKukai={embedKukai} switchTheme={handleSelectTheme} selectedTheme={selectedTheme} notifications={undefined}/> 
                <Switch>
                    <Route exact path="/store" component={StorePage} />
                    <Route path="/auctions-sales" component={AuctionsAndSales} />
                    <Route path="/browse" component={Browse} />
                    <Route path="/sign-in" render={props => <SignIn beaconWallet={beaconWallet} embedKukai={embedKukai} setSignedPayload={setSignedPayload} {...props} />} />
                    <Route path="/account/:status" render={props => <Account signedPayload={signedPayload} {...props} />}  />
                    <Route path="/profile/:username" component={Profile} />
                    <Route path="/notifications" render={props => <Notifications notifications={notifications} {...props} />}  />
                </Switch>
            </StyledBrowserRouter>
        </ThemeProvider>
  
    )
}

export default Router;
