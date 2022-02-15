import styled from '@emotion/styled';
import Typography from '../../atoms/Typography';
import { FC, useEffect, useState } from 'react';
import {
    ButtonBase,
    Stack,
    useMediaQuery,
    Theme,
    useTheme,
    Skeleton,
} from '@mui/material';
import Avatar from '../../atoms/Avatar';
import TezosLogo from '../../atoms/TezosLogo/TezosLogo';
import { useHistory } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { FormattedNumber } from 'react-intl';

export interface UsersCardProps {
    loading?: boolean;
    sx?: any;
    name?: string;
    index?: number;
    userAddress?: string;
    profilePicture?: string;
    amountBought?: any;
    id?: any;
    verified?: boolean;
    theme?: Theme;
}

const StyledIconWrapper = styled.div`
    display: block;
    position: relative;
    z-index: 9999;
    background-color: white;
    height: 1.1rem;
    width: 1.1rem;
    margin-left: -1.6rem;
    margin-top: 1.8rem;
    margin-right: 1rem;
    border-radius: 50px;
    .MuiSvgIcon-root,
    svg {
        margin-top: -0.2rem;
        margin-left: -0.2rem;
        width: 1.5rem;
    }
`;

const StyledStack = styled(Stack)``;

const StyledPictureStack = styled(Stack)`
    justify-content: center;
    align-items: center;
    position: relative;
`;

const StyledButtonBase = styled(ButtonBase)`
    .MuiAvatar-circular {
        transition: all 0.2s ease-in-out;
    }
    :hover {
        .MuiAvatar-circular {
            transition: all 0.2s ease-in-out;
            -webkit-transform: scale(1.2);
            -moz-transform: scale(1.2);
            -o-transform: scale(1.2);
            transform: scale(1.2);
            scale: 1.2;
        }
    }
`;

export const UsersCard: FC<UsersCardProps> = ({ ...props }) => {
    const [comfortLoading, setComfortLoading] = useState<boolean>(false);
    const history = useHistory();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const navigateTo = (componentURL: string) => {
        history.push(componentURL);
    };

    useEffect(() => {
        if (props.loading) {
            setComfortLoading(true);
            setTimeout(() => {
                setComfortLoading(false);
            }, 400);
        }
    }, [props.loading]);

    return (
        <StyledButtonBase
            onClick={() => navigateTo(`/profile/${props!.userAddress}`)}
            sx={{
                cursor: 'pointer',
                width: 'auto',
                marginRight: '1rem',
            }}
        >
            <StyledStack direction="row">
                <Typography
                    size="body"
                    weight="Light"
                    mr="1rem"
                    sx={{ verticalAlign: 'middle' }}
                >
                    {props.index}
                </Typography>

                <StyledPictureStack
                    direction="row"
                    spacing={3}
                    sx={{
                        maxWidth: 500,
                        justifyContent: 'center',
                        marginRight: '1rem',
                    }}
                >
                    <Avatar
                        src={props.profilePicture}
                        height={50}
                        width={50}
                        loading={props.loading}
                    />
                </StyledPictureStack>

                {props.verified ? (
                    <StyledIconWrapper>
                        <CheckCircleIcon
                            sx={{
                                marginLeft: '-.5',
                                color: '#75CFA4',
                            }}
                        />
                    </StyledIconWrapper>
                ) : (
                    ''
                )}

                <Stack direction="column" sx={{justifyContent: "center"}}>
                    {props.loading ?
                        <Skeleton width="5rem" />
                        :
                        <Typography
                            size="h5"
                            weight="SemiBold"
                            onClick={() => navigateTo(`/profile/${props.userAddress}`)}
                            width={isMobile ? '100%' : '16ch'}
                            sx={{
                                display: 'initial !important',
                                textAlign: 'left',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                letterSpacing: '0px',
                                cursor: 'pointer',
                            }}
                        >
                            {props.name}
                        </Typography>
                    }
                    {
                        props.loading ?
                            <Skeleton width="2rem" />
                        :
                            <Typography
                                size="h5"
                                weight="Medium"
                                sx={{
                                    cursor: 'pointer',
                                    width: 'auto',
                                    marginTop: '.5rem',
                                }}
                            >
                                <FormattedNumber value={props.amountBought} />
                                <TezosLogo width=".9rem" margin="0 0.2rem" />
                            </Typography>
                    }
                </Stack>
            </StyledStack>
        </StyledButtonBase>
    );
};