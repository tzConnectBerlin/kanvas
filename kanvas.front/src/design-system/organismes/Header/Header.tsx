import styled from '@emotion/styled';
import { FlexSpacerProps } from '../../atoms/FlexSpacer';
import { CustomButton } from '../../atoms/Button';
import { Box } from '@mui/system';
import { FC, useEffect, useState } from 'react';
import { Theme } from '@mui/material';
import { KukaiEmbed } from 'kukai-embed';
import { StickyLogo } from '../../atoms/StickyLogo';
import { Menu } from '../../molecules/Menu';
import { useHistory, useLocation } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { GET_LOGGED_USER } from '../../../api/queries/user';
import { IUser } from '../../../interfaces/user';
import useAxios from 'axios-hooks';
import { BeaconWallet } from "@taquito/beacon-wallet";
import { SignInModal } from '../../molecules/SignInModal';
import Avatar from '../../atoms/Avatar';
import { CustomBadge } from '../../atoms/Badge';
import Brightness3Icon from '@mui/icons-material/Brightness3';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';

export interface HeaderProps {
    user?: { role: string };
    theme?: Theme;
    loading?: boolean;
    beaconWallet?: BeaconWallet;
    embedKukai?: KukaiEmbed;
    setSignedPayload?: Function;
    handleCloseModal?: Function;
    selectedTheme: string;
    notifications?: number;
    switchTheme: Function;
    onLogout?: () => void;
    onCreateAccount?: () => void;
}

interface IUserParams {
    address: string | null;
    signedPayload: string | null;
}

const StyledBox = styled(Box) <{ theme?: Theme }>`
    margin-bottom: -6rem;
    color: ${props => props.theme.palette.text.primary};

    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);

    background-color: ${props => props.theme.header.background};
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
    width: ${props => props.display ? '' : '0rem'};
    transition: width 0.2s;
`

export const Header: FC<HeaderProps> = ({  user, selectedTheme, onLogout, onCreateAccount, switchTheme, notifications, beaconWallet, embedKukai, setSignedPayload, ...props }) => {
    const [socialLoading, setSocialLoading] = useState(false)
    const [beaconLoading, setBeaconLoading] = useState(false)
    const [signInParams, setSignInParams] = useState<IUserParams>({ address: null, signedPayload: null })

    const [open, setOpen] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleCloseModal = () => setOpen(false);

    const history = useHistory()
    const location = useLocation()



    const [avatarSrc, setAvatarSrc] = useState<string>('')

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [expandMenu, setExpandMenu] = useState(false)

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };



    // const loggedUser = {data: undefined, loading: false}
    const [loggedUser] = useAxios({
        url: 'http://localhost:3000/auth/logged_user', headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Authorization': `Bearer ${localStorage.getItem('Kanvas - Bearer')}`
        }
    })

    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [currentLoggedUser, setCurrentLoggedUser] = useState<IUser | undefined>(undefined)

    useEffect(() => {
        if (loggedUser.data) {
            setCurrentLoggedUser(loggedUser.data)
        } else if (loggedUser.error) {

        }
    }, [loggedUser])

    return (
        <StyledBox sx={{
            height: '5rem',
            display: 'flex',
            alignItems: 'center',
            paddingRight: '2rem'
        }}>
            <StickyLogo display={!isSearchOpen} />
            <Spacer display={!isSearchOpen} />

            <Menu
                history={history}
                loading={loggedUser.loading}
                user={currentLoggedUser}
                setSearchOpen={setIsSearchOpen}
                isSearchOpen={isSearchOpen}
                notifications={notifications}
                selectedTheme={selectedTheme}
                switchTheme={switchTheme}
                setOpen={setOpen}
                onLogout={onLogout}
                onCreateAccount={onCreateAccount}
            />
 
            <SignInModal
                beaconWallet={beaconWallet}
                embedKukai={embedKukai}
                setSignedPayload={setSignedPayload}
                open={open}
                handleCloseModal={handleCloseModal}
            />
             {/* const handleCloseModal = () => setOpen(false); */}

        </StyledBox>
    )
}