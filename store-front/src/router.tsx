import styled from '@emotion/styled';
import Profile from './pages/Profile';
import StorePage from './pages/StorePage';
import HomePage from './pages/HomePage';
import Faq from './pages/Faq';
import Privacy from './pages/Privacy';
import CreateNFT from './pages/CreateNFT';
import EditProfile from './pages/EditProfile';
import ProductPage from './pages/Product';
import NotFound from './pages/NotFound';
import ShoppingCart from './design-system/organismes/ShoppingCart';
import useAxios from 'axios-hooks';
import ScrollToTop from './ScrollToTop';
import CookieBanner from './design-system/molecules/CookiesBanner';
import { Redirect } from 'react-router';
import { KUKAI_NETWORK, RPC_URL } from './global';
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
import { toast } from 'react-toastify';
import { Checkout } from './pages/Checkout';

const StyledBrowserRouter = styled(BrowserRouter)<{ theme?: Theme }>`
    display: block;

    #root {
        background-color: ${(props) => props.theme.palette.background.default};
    }
`;

const Router = () => {
    const hasCookie = document.cookie.match(/^(.*;)?\s*user\s*=\s*[^;]+(.*)?$/);
    const [cookie, setCookie] = useState(false);

    const [embedKukai, setEmbedKukai] = useState<KukaiEmbed>();
    const [beaconWallet, setBeaconWallet] = useState<BeaconWallet>();

    const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark'>(
        localStorage.getItem('Kanvas - theme') as 'light' | 'dark',
    );

    const darkThemeResponsive = responsiveFontSizes(darkTheme);
    const lightThemeResponsive = responsiveFontSizes(lightTheme);

    const [nftsInCart, setNftsInCart] = useState<INft[]>([]);

    const [listCartResponse, listCart] = useAxios(
        {
            url: process.env.REACT_APP_API_SERVER_BASE_URL + `/users/cart/list`,
            method: 'POST',
            withCredentials: true,
        },
        { manual: true },
    );

    const [listCalled, setListCalled] = useState(false);

    // Getting list of nfts in the cart
    useEffect(() => {
        listCart({
            headers: {
                Authorization: `Bearer ${localStorage.getItem(
                    'Kanvas - Bearer',
                )}`,
            },
            withCredentials: true,
        })
            .then((res) => setListCalled(true))
            .catch((err) => {
                setListCalled(true);
                toast.error(err);
            });
    }, []);

    useEffect(() => {
        if (listCartResponse.data) {
            setNftsInCart(listCartResponse.data.nfts);
        }
    }, [listCartResponse]);

    useEffect(() => {
        if (!embedKukai) {
            setEmbedKukai(
                new KukaiEmbed({
                    net: Networks[KUKAI_NETWORK],
                    icon: false,
                }),
            );
        }
    }, []);

    useEffect(() => {
        initTezos(RPC_URL);
        setBeaconWallet(initWallet());
    }, []);

    const handleSelectTheme = (themeName: 'dark' | 'light') => {
        setSelectedTheme(themeName);
        localStorage.setItem('Kanvas - theme', themeName);
    };

    const [cartOpen, setCartOpen] = useState(false);
    const [loginOpen, setLoginOpen] = useState(false);
    const [redirectAfterSignIn, setRedirectAfterSignIn] = useState(true);

    return (
        <ThemeProvider
            theme={
                localStorage.getItem('Kanvas - theme') === 'dark'
                    ? darkThemeResponsive
                    : lightThemeResponsive
            }
        >
            <StyledBrowserRouter
                getUserConfirmation={(message, callback) => {
                    const allowTransition = window.confirm(message);
                    callback(allowTransition);
                }}
            >
                <Header
                    beaconWallet={beaconWallet}
                    embedKukai={embedKukai}
                    cartOpen={cartOpen}
                    setCartOpen={setCartOpen}
                    switchTheme={handleSelectTheme}
                    selectedTheme={selectedTheme}
                    nftsInCartNumber={nftsInCart.length}
                    notifications={0}
                    listCart={listCart}
                    loginOpen={loginOpen}
                    setLoginOpen={setLoginOpen}
                    redirectAfterSignIn={redirectAfterSignIn}
                    setRedirectAfterSignIn={setRedirectAfterSignIn}
                />

                <ScrollToTop>
                    <Switch>
                        <Route exact path="/">
                            <Redirect to="/home" />
                        </Route>
                        <Route path="/home" component={HomePage} />
                        <Route path="/store" component={StorePage} />
                        <Route path="/profile/edit" component={EditProfile} />
                        <Route
                            path="/profile/:userAddress"
                            component={Profile}
                        />
                        <Route
                            path="/product/:id"
                            render={(props) => (
                                <ProductPage
                                    nftsInCart={nftsInCart}
                                    setNftsInCart={setNftsInCart}
                                    listCart={listCart}
                                    {...props}
                                />
                            )}
                        />
                        <Route path="/faq" component={Faq} />{' '}
                        <Route path="/privacy" component={Privacy} />
                        <Route
                            path="/create-nft"
                            render={(props) => <CreateNFT {...props} />}
                        />
                        <Route
                            path="/nft/:id"
                            render={(props) => <CreateNFT {...props} />}
                        />
                        <Route
                            path="/checkout"
                            render={() => (
                                <Checkout
                                    nftsInCart={nftsInCart}
                                    setNftsInCart={setNftsInCart}
                                    listCart={listCart}
                                    setLoginOpen={setLoginOpen}
                                    expiresAt={listCartResponse.data?.expiresAt}
                                    loading={
                                        listCartResponse.loading && !listCalled
                                    }
                                />
                            )}
                        />
                        <Route path="/404" component={NotFound} />
                        <Redirect from="*" to="/404" />
                    </Switch>
                </ScrollToTop>
                <ShoppingCart
                    open={cartOpen}
                    nftsInCart={nftsInCart}
                    setNftsInCart={setNftsInCart}
                    listCart={listCart}
                    closeCart={() => setCartOpen(false)}
                    expiresAt={listCartResponse.data?.expiresAt}
                    loading={listCartResponse.loading && !listCalled}
                />

                {!hasCookie && (
                    <CookieBanner handleClose={() => setCookie(!cookie)} />
                )}

                <Footer />
            </StyledBrowserRouter>
        </ThemeProvider>
    );
};

export default Router;
