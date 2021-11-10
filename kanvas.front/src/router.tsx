import SignIn from './pages/SignIn';
import styled from '@emotion/styled';
import Profile from './pages/Profile';
import StorePage from './pages/StorePage';
import Faq from './pages/Faq';
import CreateNFT from './pages/CreateNFT';
import { Redirect } from 'react-router'
import { RPC_URL } from './global';
import { Theme } from '@mui/material';
import { useEffect, useState } from 'react';
import { darkTheme, lightTheme } from './theme';
import { KukaiEmbed, Networks } from 'kukai-embed';
import { BeaconWallet } from '@taquito/beacon-wallet';
import { initTezos, initWallet } from './contracts/init';
import { Header } from './design-system/organismes/Header';
import { Footer } from './design-system/organismes/Footer';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { responsiveFontSizes, ThemeProvider } from '@mui/material/styles';
import ProductPage from './pages/Product';
import NotFound from './pages/NotFound';
import ShoppingCart from './design-system/organismes/ShoppingCart';


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
                net: Networks.granadanet ,
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

    const [cartOpen, setCartOpen] = useState(false)

    return(
        <ThemeProvider theme={localStorage.getItem('Kanvas - theme') === 'dark' ? darkThemeResponsive : lightThemeResponsive } >
            <StyledBrowserRouter>
                <Header embedKukai={embedKukai} cartOpen={cartOpen} setCartOpen={setCartOpen} switchTheme={handleSelectTheme} selectedTheme={selectedTheme} notifications={undefined}/>
                <Switch>
                    <Route exact path="/Store" component={StorePage} />
                    <Route path="/sign-in" render={props => <SignIn beaconWallet={beaconWallet} embedKukai={embedKukai} setSignedPayload={setSignedPayload} {...props} />} />
                    <Route path="/profile/:username" component={Profile} />
                    <Route path="/product/:id" component={ProductPage} />
                    <Route path="/faq" component={Faq} />
                    <Route path="/create-nft" render={props => <CreateNFT {...props} />}  />
                    <Route path="/nft/:id" render={props => <CreateNFT {...props} />}  />
                    <Route path='/404' component={NotFound} exact={true} />
                    <Redirect from='*' to='/404' />
                </Switch>
                <ShoppingCart open={cartOpen} closeCart={() => setCartOpen(false)}/>

                <Footer />
            </StyledBrowserRouter>
        </ThemeProvider>
    )
}

export default Router;
