import styled from '@emotion/styled';
import Avatar from '../../../atoms/Avatar';
import Brightness3Icon from '@mui/icons-material/Brightness3';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';
import ProfilePopover from '../../ProfilePopover';

import { Badge } from '@mui/material';
import { QuickSearch } from '../../../molecules/QuickSearch';
import { FC, useState } from 'react';
import { Stack } from '@mui/material';
import { CustomButton } from '../../../atoms/Button';
import { Typography } from '../../../atoms/Typography';
import { MenuProps, StyledShoppingCartRoundedIcon, StyledLink } from '../Menu';
import { useTranslation } from 'react-i18next';
import { useHistory, useLocation } from 'react-router-dom';

const DesktopMenuContent = styled(Stack)`
    display: none;
    margin-top: 0 !important;

    @media (min-width: 875px) {
        display: flex;
    }
`;

export const DesktopMenu: FC<MenuProps> = ({ user, onLogout, ...props }) => {
    const history = useHistory();
    const location = useLocation();

    const { t } = useTranslation(['translation']);

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <>
            <DesktopMenuContent
                direction={{ xs: 'row' }}
                spacing={4}
                sx={{ display: 'flex', alignItems: 'center' }}
            >
                {/* Link to general pages */}

                {location.pathname === '/sign-in' ||
                location.pathname === '/account/create' ? undefined : (
                    <>
                        <StyledLink
                            to="/home"
                            isSearchOpen={props.isSearchOpen}
                        >
                            <Typography
                                size="inherit"
                                weight="Light"
                                color="#9b9b9b"
                                sx={{ cursor: 'pointer' }}
                            >
                                {t('menu.home')}
                            </Typography>
                        </StyledLink>

                        <StyledLink
                            to="/store?orderBy=createdAt&orderDirection=desc"
                            isSearchOpen={props.isSearchOpen}
                        >
                            <Typography
                                size="inherit"
                                weight="Light"
                                color="#9b9b9b"
                                sx={{ cursor: 'pointer' }}
                            >
                                {t('menu.store')}
                            </Typography>
                        </StyledLink>

                        {/* Quick Search controlling the opacity and position of the links above */}

                        <QuickSearch searchOpen={props.isSearchOpen ?? false} setSearchOpen={props.setSearchOpen} />
                    </>
                )}

                {/* Call to action button: `Sign in`, `Add artwork` for curators and artists, and profile avatar to display the submenu */}

                {localStorage.getItem('Kanvas - address') ===
                user?.userAddress ? (
                    <Avatar
                        src={`${user?.profilePicture}?${Date.now()}`}
                        onClick={(e) =>
                            anchorEl === null ? handleClick(e) : handleClose()
                        }
                        sx={{ cursor: 'pointer !important' }}
                    />
                ) : location.pathname === '/sign-in' ||
                  location.pathname === '/account/create' ||
                  location.pathname === '/account/edit' ? undefined : (
                    <CustomButton
                        size="medium"
                        onClick={() => props.setOpen(true)}
                        label="Sign in"
                        loading={props.loading}
                    />
                )}

                <Badge color="error" badgeContent={props.nftsInCartNumber}>
                    <StyledShoppingCartRoundedIcon
                        onClick={() => props.openOrCloseShoppingCart()}
                    />
                </Badge>
                {props.selectedTheme === 'dark' ? (
                    <Brightness3Icon
                        onClick={() => props.switchTheme('light')}
                        sx={{ cursor: 'pointer' }}
                    />
                ) : (
                    <WbSunnyOutlinedIcon
                        onClick={() => props.switchTheme('dark')}
                        sx={{ cursor: 'pointer' }}
                    />
                )}
            </DesktopMenuContent>

            <ProfilePopover
                open={Boolean(anchorEl)}
                avatarSrc={`${user?.profilePicture}?${Date.now()}`}
                address={user?.userAddress}
                history={history}
                logOut={onLogout}
                onClose={handleClose}
                onClick={handleClose}
            />
        </>
    );
};
