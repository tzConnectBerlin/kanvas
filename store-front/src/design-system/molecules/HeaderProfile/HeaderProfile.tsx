import styled from '@emotion/styled';
import Avatar from '../../atoms/Avatar';
import Typography from '../../atoms/Typography';
import FlexSpacer from '../../atoms/FlexSpacer';

import { FC, useState } from 'react';
import { FiCopy } from 'react-icons/fi';
import { Skeleton, Stack, Theme } from '@mui/material';
import { IUser } from '../../../interfaces/user';
import { CustomButton } from '../../atoms/Button';
import { Animated } from 'react-animated-css';

interface HeaderProfileProps {
    user: IUser;
    loading: boolean;
    theme?: Theme;
    nftsCount: number;
    editProfile: Function;
    userDomain: string;
    userDomainLoading: boolean;
}

const FiCopyStyled = styled(FiCopy)<{ theme?: Theme; loading: boolean }>`
    color: ${(props) =>
        props.loading ? '#C4C4C4' : props.theme.palette.text.primary};
    cursor: ${(props) => (props.loading ? '' : 'pointer')};
`;

const StyledPictureStack = styled(Stack)`
    justify-content: center;
    align-items: center;
    position: relative;
    min-height: 195px;

    @media (max-width: 600px) {
        margin-top: 2rem;
        min-height: 8rem;
    }
`;

const StyledTypography = styled(Typography)`
    -webkit-box-align: start;
`;

const AddressStack = styled(Stack)`
    display: flex;
    margin-top: 0.5rem;
`;

const MobileWrapperStack = styled(Stack)`
    display: none;
    padding-bottom: 2rem;
    width: 100%;

    @media (max-width: 600px) {
        display: flex;
    }
`;

const DesktopWrapperStack = styled(Stack)`
    display: flex;
    width: 100%;

    @media (max-width: 600px) {
        display: none;
    }
`;

const StyledAnimated = styled(Animated)`
    display: flex;
    justify-content: center;
`;

export const HeaderProfile: FC<HeaderProfileProps> = ({ ...props }) => {
    const [tooltipText, setTooltipText] = useState('');
    const [showCopyOverlay, setShowCopyOverlay] = useState(false);

    const copyAddressToClipBoard = () => {
        try {
            navigator.clipboard.writeText(props.user?.userAddress);

            setTooltipText('Copied !'); // copy succeed.
            setShowCopyOverlay(true);

            setTimeout(() => {
                setShowCopyOverlay(false);
            }, 1000);
        } catch (e) {
            setTooltipText('Oops..'); // copy failed.
            setTimeout(() => {
                setShowCopyOverlay(false);
            }, 1000);
        }
    };

    return (
        <>
            {/* Desktop version  */}
            <DesktopWrapperStack direction="row" spacing={9}>
                <StyledPictureStack
                    direction="column"
                    spacing={3}
                    sx={{ maxWidth: 200, justifyContent: 'center' }}
                >
                    <Avatar
                        src={`${props.user?.profilePicture}`}
                        height={150}
                        width={150}
                        loading={props.loading}
                    />
                </StyledPictureStack>

                <Stack
                    direction="column"
                    sx={{ width: '100%', justifyContent: 'center' }}
                >
                    <Stack
                        direction="row"
                        spacing={2}
                        sx={{ alignItems: 'center', width: '100%' }}
                    >
                        <Typography
                            size="h2"
                            weight="SemiBold"
                            noWrap={true}
                            align="left"
                            sx={{ marginRight: '2rem' }}
                            display="block"
                        >
                            {' '}
                            {props.loading ? (
                                <Skeleton width="15rem" />
                            ) : (
                                props.user?.userName
                            )}{' '}
                        </Typography>

                        <FlexSpacer minWidth={0} />

                        {
                            // Here goes validation if user profile is logged in user
                            localStorage.getItem('Kanvas - address') ===
                            props.user?.userAddress ? (
                                <CustomButton
                                    size="medium"
                                    onClick={() => props.editProfile()}
                                    label="Edit profile"
                                    aria-label="Edit profile button"
                                    role="button"
                                />
                            ) : undefined
                        }
                    </Stack>
                    <AddressStack
                        direction="row"
                        spacing={2}
                        sx={{ maxWidth: 400, alignItems: 'center' }}
                    >
                        <Typography
                            size="h5"
                            weight="Light"
                            color="#C4C4C4"
                            noWrap={true}
                            align="left"
                            display="initial !important"
                            maxWidth="16rem"
                        >
                            {' '}
                            {props.loading || props.userDomainLoading ? (
                                <Skeleton width="5rem" />
                            ) : props.userDomain !== '' ? (
                                props.userDomain
                            ) : (
                                props.user?.userAddress
                            )}{' '}
                        </Typography>
                        <FiCopyStyled
                            onClick={() =>
                                props.loading ? {} : copyAddressToClipBoard()
                            }
                            loading={props.loading}
                        />
                    </AddressStack>

                    <StyledAnimated
                        animationIn="fadeIn"
                        animationOut="fadeOut"
                        isVisible={showCopyOverlay}
                    >
                        <Typography
                            size="body"
                            weight="Light"
                            color="#363636"
                            noWrap={true}
                            align="center"
                            width="6rem"
                            sx={{
                                position: 'absolute',
                                bottom: '-2rem',
                                justifyContent: 'center',
                            }}
                        >
                            {' '}
                            {tooltipText}{' '}
                        </Typography>
                    </StyledAnimated>

                    <Stack
                        direction="row"
                        spacing={2}
                        sx={{ marginTop: '1.5rem' }}
                    >
                        <Typography size="body1" weight="Medium" align="left">
                            {props.loading ? (
                                <Skeleton
                                    animation="pulse"
                                    variant="circular"
                                    width="12px"
                                    height="12px"
                                />
                            ) : (
                                props.nftsCount
                            )}
                        </Typography>
                        <Typography
                            size="body1"
                            weight="Light"
                            color="#C4C4C4"
                            truncate={true}
                            align="left"
                        >
                            {props.loading ? (
                                <Skeleton
                                    animation="pulse"
                                    width="24px"
                                    height="1.5rem"
                                />
                            ) : (
                                'Nfts'
                            )}
                        </Typography>
                    </Stack>

                    <StyledTypography
                        size="body1"
                        weight="Light"
                        color="#9b9b9b"
                        truncate={true}
                        align="left"
                        width={400}
                        sx={{ marginTop: '0.5rem', alignItems: 'left' }}
                    >
                        {' '}
                        {props.loading ? (
                            <Skeleton animation="pulse" width="5rem" />
                        ) : (
                            props.user?.createdAt &&
                            `Joined in ${new Date(
                                props.user?.createdAt * 1000,
                            ).toLocaleString('default', {
                                month: 'long',
                            })} , ${new Date(
                                props.user?.createdAt * 1000,
                            ).getFullYear()}`
                        )}
                    </StyledTypography>
                </Stack>
            </DesktopWrapperStack>

            {/* Mobile Version */}
            <MobileWrapperStack direction="column">
                <StyledPictureStack direction="row" spacing={3}>
                    <Avatar
                        src={props.user?.profilePicture}
                        height={190}
                        width={190}
                        loading={props.loading}
                        responsive={true}
                    />
                    <FlexSpacer minWidth={2} />
                </StyledPictureStack>

                <Stack
                    direction="column"
                    sx={{
                        width: '100%',
                        alignItems: 'start',
                        marginTop: '1rem',
                    }}
                >
                    <Typography
                        fontSize={'1.6em'}
                        weight="SemiBold"
                        noWrap={true}
                        align="right"
                        display="block"
                        aria-label="User name"
                    >
                        {' '}
                        {props.loading ? (
                            <Skeleton width="15rem" />
                        ) : (
                            props.user?.userName
                        )}{' '}
                    </Typography>

                    <AddressStack
                        direction="row"
                        spacing={2}
                        sx={{ width: '100%', alignItems: 'center' }}
                    >
                        <Typography
                            size="h5"
                            weight="Light"
                            color="#C4C4C4"
                            noWrap={true}
                            align="center"
                            display="initial !important"
                            width="50%"
                            aria-label="User adress"
                        >
                            {' '}
                            {props.loading ? (
                                <Skeleton width="5rem" />
                            ) : (
                                props.user?.userAddress
                            )}{' '}
                        </Typography>
                        <FiCopyStyled
                            onClick={() =>
                                props.loading ? {} : copyAddressToClipBoard()
                            }
                            loading={props.loading}
                        />
                    </AddressStack>
                </Stack>

                <Stack direction="row" spacing={2} sx={{ marginTop: '1.5rem' }}>
                    <Typography size="body1" weight="Medium" align="left">
                        {' '}
                        {props.loading ? (
                            <Skeleton
                                animation="pulse"
                                variant="circular"
                                width="14px"
                                height="14px"
                                sx={{ marginBottom: '0.5rem' }}
                            />
                        ) : (
                            props.nftsCount
                        )}
                    </Typography>
                    <Typography
                        size="body1"
                        weight="Light"
                        color="#C4C4C4"
                        truncate={true}
                        align="left"
                        aria-label="User nfts"
                    >
                        {' '}
                        Nfts{' '}
                    </Typography>
                </Stack>
            </MobileWrapperStack>
        </>
    );
};
