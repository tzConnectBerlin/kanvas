import SignIn from './pages/SignIn';
import styled from '@emotion/styled';
import Account from './pages/Account';
import Profile from './pages/Profile';
import Browse from './pages/Browse/index';
import StorePage from './pages/StorePage';
import Notifications from './pages/Notifications';
import AuctionsAndSales from './pages/Auctions&Sales/index';
import CreateNFT from './pages/CreateNFT';

import { RPC_URL } from './global';
import { Theme } from '@mui/material';
import { useEffect, useState } from 'react';
import { darkTheme, lightTheme } from './theme';
import { KukaiEmbed, Networks } from 'kukai-embed';
import { BeaconWallet } from '@taquito/beacon-wallet';
import { initTezos, initWallet } from './contracts/init';
import { Header } from './design-system/organismes/Header';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { responsiveFontSizes, ThemeProvider } from '@mui/material/styles';
import { INotification, NotificationEnum, CurrencyEnum } from './interfaces/notification';
import ProductPage from './pages/Product';


const StyledBrowserRouter = styled(BrowserRouter)<{theme?: Theme}>`
    #root {
        background-color: ${props => props.theme.palette.background.default};
    }
`

const Router = () => {

    const [embedKukai, setEmbedKukai] = useState<KukaiEmbed>();
    const [beaconWallet, setBeaconWallet] = useState<BeaconWallet>()
    const[ signedPayload, setSignedPayload] = useState('')

    const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark'>(localStorage.getItem('Kanvas - theme') as "light" | "dark")

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

    useEffect(() => {
        window.addEventListener("storage", () => {
          // When storage changes refetch
          const test = localStorage.getItem('Kanvas - Bearer')
        });

        return () => {
          // When the component unmounts remove the event listener
          window.removeEventListener("storage", () => {});
        };
    }, []);

    const handleSelectTheme = (themeName: 'dark' | 'light') => {
        setSelectedTheme(themeName)
        localStorage.setItem('Kanvas - theme', themeName)
    }

    return(
        <ThemeProvider theme={localStorage.getItem('Kanvas - theme') === 'dark' ? darkThemeResponsive : lightThemeResponsive } >
            <StyledBrowserRouter>
                <Header embedKukai={embedKukai} switchTheme={handleSelectTheme} selectedTheme={selectedTheme} notifications={undefined}/>
                <Switch>
                    <Route exact path="/store" component={StorePage} />
                    <Route path="/sign-in" render={props => <SignIn beaconWallet={beaconWallet} embedKukai={embedKukai} setSignedPayload={setSignedPayload} {...props} />} />
                    <Route path="/profile/:username" component={Profile} />
                    <Route path="/product" component={ProductPage} />
                    <Route path="/create-nft" render={props => <CreateNFT {...props} />}  />
                    <Route path="/nft/:id" render={props => <CreateNFT {...props} />}  />
                </Switch>
            </StyledBrowserRouter>
        </ThemeProvider>
    )
}

export default Router;
