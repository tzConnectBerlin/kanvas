import styled from '@emotion/styled';
import Profile from './pages/Profile';
import StorePage from './pages/StorePage';
import Faq from './pages/Faq';
import CreateNFT from './pages/CreateNFT';
import EditProfile from './pages/EditProfile';
import ProductPage from './pages/Product';
import NotFound from './pages/NotFound';
import ShoppingCart from './design-system/organismes/ShoppingCart';
import useAxios from 'axios-hooks';
import ScrollToTop from './ScrollToTop';

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
import { INft } from './interfaces/artwork';


const StyledBrowserRouter = styled(BrowserRouter)<{theme?: Theme}>`
    display: block;

    #root {
        background-color: ${props => props.theme.palette.background.default};
    }
`

const Router = () => {

    const [embedKukai, setEmbedKukai] = useState<KukaiEmbed>();
    const [beaconWallet, setBeaconWallet] = useState<BeaconWallet>()

    const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark'>(localStorage.getItem('Kanvas - theme') as "light" | "dark")

    const darkThemeResponsive = responsiveFontSizes(darkTheme);
    const lightThemeResponsive = responsiveFontSizes(lightTheme);

    const [nftsInCart, setNftsInCart] = useState<INft[]>([])
    const [addToCartResponse, addToCart] = useAxios(process.env.REACT_APP_API_SERVER_BASE_URL + '/user/cart/add/:id', {manual: true})
    const [deleteFromCartResponse, deleteFromCart] = useAxios(process.env.REACT_APP_API_SERVER_BASE_URL + '/cart/delete/:id', {manual: true})


    const handleAddToBasket = (nftId: number) => {
        alert('Nft with id ' + nftId + ' has been added to the basket')
    }

    const handleDeleteFromBasket = (nftId: number) => {
        alert('Nft with id ' + nftId + ' has been deleted from the basket')
    }

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

    const handleSelectTheme = (themeName: 'dark' | 'light') => {
        setSelectedTheme(themeName)
        localStorage.setItem('Kanvas - theme', themeName)
    }

    const [cartOpen, setCartOpen] = useState(false)

    return(
        <ThemeProvider theme={localStorage.getItem('Kanvas - theme') === 'dark' ? darkThemeResponsive : lightThemeResponsive } >
            <StyledBrowserRouter>
                <Header beaconWallet={beaconWallet} embedKukai={embedKukai} cartOpen={cartOpen} setCartOpen={setCartOpen} switchTheme={handleSelectTheme} selectedTheme={selectedTheme} notifications={0}/>
                <ScrollToTop>
                    <Switch>
                        <Route exact path="/store" component={StorePage} />
                        <Route path="/profile/edit" component={EditProfile} />
                        <Route path="/profile/:username" component={Profile} />
                        <Route path="/product/:id" render={props => <ProductPage addToBasket={handleAddToBasket} {...props}/> }/>
                        <Route path="/faq" component={Faq} />
                        <Route path="/create-nft" render={props => <CreateNFT {...props} />}  />
                        <Route path="/nft/:id" render={props => <CreateNFT {...props} />}  />
                        <Route path='/404' component={NotFound} />
                        <Redirect from='*' to='/404' />
                    </Switch>
                </ScrollToTop>
                <ShoppingCart open={cartOpen} nftsInCart={nftsInCart} closeCart={() => setCartOpen(false)} deleteNftFromBasket={handleDeleteFromBasket}/>
                <Footer />
            </StyledBrowserRouter>
        </ThemeProvider>
    )
}

export default Router;
