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
import { Modal, Stack, Theme } from '@mui/material';
import { CustomBadge } from '../../atoms/Badge';
import { CustomButton } from '../../atoms/Button';
import { Typography } from '../../atoms/Typography';
import { QuickSearch } from '../../molecules/QuickSearch';
import { IUser } from '../../../interfaces/user';
import { Box } from '@mui/system';
import SignInPage from '../../../pages/SignIn';
import { Animated } from "react-animated-css";
import { cssTransition } from 'react-toastify';
import { BeaconWallet } from "@taquito/beacon-wallet";
import { setWalletProvider } from "../../../contracts/init";
import { SigningType, RequestSignPayloadInput, NetworkType, PermissionResponseOutput, ErrorResponse } from "@airgap/beacon-sdk";
import PageWrapper from "../../../design-system/commons/PageWrapper";
import { SIGN_USER } from '../../../api/queries/user';
import { char2Bytes } from "@taquito/utils";
import { useLazyQuery } from "@apollo/client";
import useAxios from 'axios-hooks';
import { toast } from 'react-toastify';

interface SignInPageProps {
    theme?: Theme;
    beaconWallet?: BeaconWallet;
    embedKukai?: KukaiEmbed;
    setSignedPayload?: Function;
}

const StyledStack = styled(Stack)`
    width: 100%;
    max-width: 100rem;
`

const StyledExternalLink = styled.a`
    text-decoration: none;
`

const WrapperTitle = styled.div`
    width: 100%;

    @media (max-width: 1100px) {
        width: 100%;
    }
`

interface IUserParams {
    address: string | null;
    signedPayload?: string | null;
}


interface MenuProps {
    user?: IUser;
    loading?: boolean;
    embedKukai?: KukaiEmbed;
    selectedTheme: string;
    beaconWallet?: BeaconWallet;
    switchTheme: Function;
    notifications?: number;
    isSearchOpen: boolean;
    setSearchOpen: Function;
    theme?: Theme;
    setSignedPayload?: Function;
    history: any;
    onLogout?: () => void;
    onCreateAccount?: () => void;
}

const style = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '30rem',
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};

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

const StyledLink = styled(NavLink) <SearchProps>`
    color: ${props => props.theme.palette.text.primary};
    text-decoration: none;

    display: ${props => props.isSearchOpen ? 'none' : 'flex'};

    @media (max-width: 1100px) {
        height: 2rem;
    }

    &.active {
        p {
            font-family: 'Poppins Medium' !important;
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
    height: 2.1rem;
    width: 2.1rem;

    background-color: ${props => props.theme.palette.background.paper};
    outline: ${props => `solid 1px ${props.theme.palette.text.primary}`};
    transition: filter 0.2s;

    display: flex;
    align-items: center;
    justify-content: center;

    transition: all 500ms cubic-bezier(0, .61, .28, .92);
    transition-property: all;
    transition-property: opacity, transform, visibility, filter;

    &:hover {
        cursor: pointer;
        outline: ${props => `solid 2px ${props.theme.palette.text.primary}`};
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

const MobileStyledMenuHeader = styled(Stack) <SearchProps>`
    display: none;
    margin-top: 0rem !important;

    @media (max-width: 1099px) {
        display: flex;
        align-items: center;
        height: 6rem;
        padding-right: 0.5rem;
        width: ${props => props.isSearchOpen ? "100%" : ""};
    }

    @media (max-width: 730px) {
        display: flex;
        align-items: center;
        padding-right: 0rem;
        height: 4rem;
        width: ${props => props.isSearchOpen ? "100%" : ""};
    }
`

const MobileStyledMenuContent = styled(Stack) <MenuIconProps>`
   display: none;

   @media (max-width: 1100px) {
        display: ${props => props.expandMenu ? 'flex' : 'none'};
        height: ${props => props.expandMenu ? 'auto' : '0'};
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
        background-color: ${props => props.theme.palette.background.default};
    }

`

const DesktopMenuContent = styled(Stack)`
    display: none;

    @media (min-width: 1100px) {
        display: flex;
    }
`

export const Menu: FC<MenuProps> = ({ user, selectedTheme, onLogout, onCreateAccount, switchTheme, beaconWallet, embedKukai, ...props }) => {
    const [open, setOpen] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleCloseModal = () => setOpen(false);

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



    const [socialLoading, setSocialLoading] = useState(false)
    const [beaconLoading, setBeaconLoading] = useState(false)
    const [signInParams, setSignInParams] = useState<IUserParams>({ address: null, signedPayload: null })

    // const [signUser, signUserResponse] = useLazyQuery(SIGN_USER)
    const [signUserResponse, signUser] = useAxios({
        url: 'http://localhost:3000/auth/login', method: 'POST', headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    }, { manual: true })

    const [registerUserResponse, registerUser] = useAxios({
        url: 'http://localhost:3000/auth/register', method: 'POST', headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    }, { manual: true })


    // Sign expression function to sign user in
    const signExpression = async (userAddress: string, loginType: "embed" | "beacon") => {

        // The data to format
        const dappUrl = "d-art.io";
        const input = `Welcome to Kanvas ${userAddress}`;

        // The full string
        const formattedInput: string = [
            "Tezos Signed Message:",
            dappUrl,
            input
        ]
            .join(" ");

        const bytes = "05" + char2Bytes(formattedInput);

        const payload: RequestSignPayloadInput = {
            signingType: SigningType.MICHELINE,
            payload: bytes,
            sourceAddress: userAddress,
        }

        // Beacon signExpression
        if (beaconWallet && loginType === "beacon") {

            try {
                const signedPayload = await beaconWallet.client.requestSignPayload(payload)
                setSignInParams({ address: userAddress, signedPayload: signedPayload.signature })
                signUser({ data: { name: userAddress, address: userAddress, signedPayload: signedPayload.signature } })
            } catch (error) {
                console.log(error)
                setBeaconLoading(false)
            }


        } else if (embedKukai && loginType === "embed") {
            try {
                const signedPayload = await embedKukai.signExpr('0501000000' + payload.payload.slice(2), 'Kanvas - sign in', 'Allow user to sign an expression with there wallet in order to sign them in.')
                setSignInParams({ address: userAddress, signedPayload: signedPayload })
                signUser({ data: { address: userAddress, signedPayload: signedPayload } })
            } catch (error) {
                setSocialLoading(false)
                embedKukai.deinit()
            }
        }
    }

    const requestUserWalletPermission = async (loginType: 'embed' | 'beacon') => {
        if (beaconWallet && loginType === 'beacon') {
            setBeaconLoading(true)

            beaconWallet.client.requestPermissions({ network: { type: NetworkType.FLORENCENET } })
                .then(async (response: PermissionResponseOutput) => {
                    signExpression(response.address, 'beacon')
                })
                .catch((permissionError: ErrorResponse) => {
                    console.log(permissionError)
                    setBeaconLoading(false)
                })

            setBeaconLoading(false)

        } else if (embedKukai && loginType === 'embed') {
            setSocialLoading(true)

            if (!embedKukai.initialized) {
                await embedKukai.init();
            }

            let userInfo: any = null;

            if (!embedKukai.user) {
                setSocialLoading(false)
                userInfo = await embedKukai.login();
            } else {
                userInfo = embedKukai.user;
            }

            if (userInfo) {
                signExpression(userInfo.pkh, 'embed')
            }
        }
    }

    useEffect(() => {
        if (beaconWallet) {
            setWalletProvider(beaconWallet);
        }
    }, [beaconWallet])

    const fade = cssTransition({
        enter: "animate__animated animate__fadeIn",
        exit: "animate__animated animate__fadeOut"
    });

    useEffect(() => {
        if (signUserResponse.data) {

            setSocialLoading(false)
            setBeaconLoading(false)

            localStorage.setItem('Kanvas - Bearer', signUserResponse.data.token)
            localStorage.setItem('Kanvas - address', signUserResponse.data.address)

            history.push(`/store`)
        }

    }, [signUserResponse.data])

    useEffect(() => {
        if (registerUserResponse.data) {

            setSocialLoading(false)
            setBeaconLoading(false)

            localStorage.setItem('Kanvas - Bearer', registerUserResponse.data.token)
            localStorage.setItem('Kanvas - address', registerUserResponse.data.address)

            history.push(`/store`)
        }

    }, [registerUserResponse.data])

    useEffect(() => {
        if (signUserResponse.error) {
            setSocialLoading(false)
            setBeaconLoading(false)

            if (signUserResponse.error?.response?.data.message === 'User not registered.') {
                // Check if we have information from the user thanks to kukai
                registerUser({ data: signInParams })

            } else {
                toast.error(signUserResponse.error.message, { position: toast.POSITION.TOP_RIGHT, transition: fade })
            }
        }
    }, [signUserResponse.error])



    return (
        <>
            <StyledMenuStack direction={{ xs: 'column', sm: 'column', md: 'row' }} spacing={4} sx={{ display: 'flex', alignItems: 'center' }} >

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
                            <MenuBarUp expandMenu={props.isSearchOpen ? props.isSearchOpen : expandMenu} />
                            <MenuBarDown expandMenu={props.isSearchOpen ? props.isSearchOpen : expandMenu} />
                        </MenuBarWrapper>
                    </WrapperMenuIcon>

                    <WrapperThemeIcon isSearchOpen={props.isSearchOpen}>
                        {
                            selectedTheme === 'dark' ?
                                <Brightness3Icon onClick={() => switchTheme('light')} sx={{ cursor: 'pointer', bottom: 0 }} />
                                :
                                <WbSunnyOutlinedIcon onClick={() => switchTheme('dark')} sx={{ cursor: 'pointer', bottom: 0 }} />
                        }
                    </WrapperThemeIcon>
                </MobileStyledMenuHeader>

                {/* Mobile Menu Content */}

                <MobileStyledMenuContent expandMenu={expandMenu} direction="column" spacing={2} sx={{ alignItems: 'beginning' }}>

                    <StyledLink to='/store' >
                        <Typography size="h2" weight="SemiBold" color='#9b9b9b' sx={{ cursor: 'pointer' }}> Store </Typography>
                    </StyledLink>

                    <FlexSpacer borderBottom={false} minHeight={2} />

                    {/* Call to action button: `Sign in` and `Add artwork` for curators and artists */}

                    {
                        // add localStorage.getItem in a useState hook to get the state after signning in.
                        localStorage.getItem('Kanvas - address') === user?.address ?
                            user?.role === 'creator' ?
                                <CustomButton size="medium" onClick={onLogout} label="Add artwork" />
                                :
                                undefined
                            :
                            <CustomButton size="medium" onClick={() => navigateTo('sign-in')} label="Sign in" />
                    }

                    <FlexSpacer borderBottom={true} />

                    {/* Sub menu to navigate to personnal pages such as notifications profile or simply to logout */}

                    {
                        localStorage.getItem('Kanvas - address') === user?.address ?
                            <>
                                <Stack direction="row" sx={{ alignItems: "center" }} spacing={3}>
                                    <Avatar src={`${avatarSrc}?${Date.now()}`} sx={{ cursor: 'pointer !important' }} />
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
                                        <LogoutRoundedIcon sx={{ '&.MuiSvgIcon-root': { marginLeft: 0.5, height: '65%', width: '60%' } }} />
                                    </Avatar>
                                    <Typography size="inherit" weight="Medium"> Sign out </Typography>
                                </Stack>
                            </>
                            :
                            undefined
                    }


                </MobileStyledMenuContent>

                {/* Desktop Menu */}

                <DesktopMenuContent direction={{ xs: 'column', sm: 'column', md: 'row' }} spacing={4} sx={{ display: 'flex', alignItems: 'center' }}>

                    {/* Link to general pages */}

                    {
                        location.pathname === '/sign-in' || location.pathname === '/account/create' ?
                            undefined
                            :
                            <>
                                <StyledLink to='/store' isSearchOpen={props.isSearchOpen}>
                                    <Typography size="inherit" weight="Light" color='#9b9b9b' sx={{ cursor: 'pointer' }}> Store </Typography>
                                </StyledLink>

                                {/* Quick Search controlling the opacity and position of the links above */}

                                <QuickSearch setSearchOpen={props.setSearchOpen} />
                            </>
                    }


                    {/* Call to action button: `Sign in`, `Add artwork` for curators and artists, and profile avatar to display the submenu */}

                    {
                        localStorage.getItem('Kanvas - address') === user?.address ?
                            user?.role === 'collector' ?
                                <CustomBadge color="error" badgeContent={props.notifications} max={99} profile={true}>
                                    <Avatar src={`${avatarSrc}?${Date.now()}`} onClick={(e) => anchorEl === null ? handleClick(e) : handleClose()} sx={{ cursor: 'pointer !important' }} />
                                </CustomBadge>
                                :
                                <>
                                    <CustomButton size="medium" onClick={() => { history.push('/create-nft') }} label="Create NFT" />
                                    <CustomBadge color="error" badgeContent={props.notifications} max={99} profile={true}>
                                        <Avatar src={`${avatarSrc}?${Date.now()}`} onClick={(e) => anchorEl === null ? handleClick(e) : handleClose()} sx={{ cursor: 'pointer !important' }} />
                                    </CustomBadge>
                                </>
                            :
                            location.pathname === '/sign-in' || location.pathname === '/account/create' || location.pathname === '/account/edit' ?
                                undefined
                                :
                                <CustomButton size="medium" onClick={handleOpen} label="Sign in" loading={props.loading} />

                        // <CustomButton size="medium" onClick={() => navigateTo('sign-in')} label="Sign in" loading={props.loading}/>
                    }

                    <Modal
                        keepMounted
                        open={open}
                        onClose={handleCloseModal}
                        aria-labelledby="keep-mounted-modal-title"
                        aria-describedby="keep-mounted-modal-description"
                    >
                        <Box sx={style}>
                            {/* <Typography id="keep-mounted-modal-title" size="h6" weight="SemiBold">
                                Text in a modal
                            </Typography>
                            <Typography id="keep-mounted-modal-description" size="body" weight="Light" sx={{ mt: 2 }}>
                                Duis mollis, est non commodo luctus, nisi erat porttitor ligula.
                            </Typography> */}

                            <StyledStack direction="column" spacing={3}>

                                <FlexSpacer minHeight={1} />

                                <WrapperTitle>
                                    <Animated animationIn="fadeIn" animationOut="fadeOut" isVisible={true}>
                                        <Typography size="h1" weight='SemiBold' sx={{ justifyContent: 'center' }}> Sign in</Typography>
                                    </Animated>
                                    <FlexSpacer minHeight={1} />
                                    <Typography size="h2" weight='Light' color={'#C4C4C4'} sx={{ textAlign: 'center',justifyContent: 'center' }}> Welcome to Kanvas !</Typography>
                                    <Typography size="h2" weight='Light' color={'#C4C4C4'} sx={{ textAlign: 'center',justifyContent: 'center' }}> Let’s begin by connecting your wallet.</Typography>

                                </WrapperTitle>

                                <FlexSpacer minHeight={1} />


                                <Stack direction={{ xs: 'row', sm: 'row' }} spacing={3} sx={{ alignItems: "center", justifyContent: 'center' }}>
                                    <CustomButton size="large" onClick={() => requestUserWalletPermission('beacon')} label="Connect wallet" loading={beaconLoading} />
                                    <Typography size="h4" weight='Light'> Or </Typography>
                                    <CustomButton size="large" onClick={() => requestUserWalletPermission('embed')} label="Social sign in" loading={socialLoading} />
                                </Stack>


                                <StyledExternalLink href="" target='_blank'>
                                    <Typography size="h4" weight='Light' color={'#15a0e1'} sx={{ justifyContent: 'center' }}> What's a wallet ? </Typography>
                                </StyledExternalLink>
                                <FlexSpacer minHeight={2} />

                            </StyledStack>

                        </Box>
                    </Modal>
                    {
                        selectedTheme === 'dark' ?
                            <Brightness3Icon onClick={() => switchTheme('light')} sx={{ cursor: 'pointer' }} />
                            :
                            <WbSunnyOutlinedIcon onClick={() => switchTheme('dark')} sx={{ cursor: 'pointer' }} />
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