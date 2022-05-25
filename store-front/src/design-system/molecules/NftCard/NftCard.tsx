import { Skeleton, Stack, Theme, useTheme } from '@mui/material';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '../../atoms/Typography';
import { useHistory } from 'react-router-dom';
import styled from '@emotion/styled';
import { Box } from '@mui/system';
import TezosLogo from '../../atoms/TezosLogo/TezosLogo';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import CircularProgress from '../../atoms/CircularProgress';
import CustomCircularProgress from '../../atoms/CircularProgress';
import FlexSpacer from '../../atoms/FlexSpacer';

export interface NftCardProps {
    loading?: boolean;
    id?: string;
    name?: string;
    price?: number;
    height?: number;
    ipfsHash?: string;
    openFilters?: boolean;

    displayUri?: string;
    thumbnailUri?: string;

    launchAt?: number;
    editionsAvailable?: number;
    nftCardMode?: 'user';
    ownerStatus?: 'pending' | 'owned';
}

const StyledCard = styled(Card)<{ theme?: Theme }>`
    &.MuiPaper-root {
        background-image: none !important;
        background-color: ${(props) => props.theme.palette.background.default};
    }
`;

const StyledBioWrapper = styled.div<{ theme?: Theme }>`
    align-self: flex-start;
    width: 100%;
`;

const StyledImgWrapper = styled.div<{ theme?: Theme }>`
    position: relative;
    overflow: hidden;
    height: 22.5vw !important;
    max-height: 25rem !important;
    border-radius: 1rem;
    transition: scale 0.2s;

    :hover {
        scale: 0.98;
    }

    @media (max-width: 1200px) {
        min-height: 24.5vw;
    }

    @media (max-width: 900px) {
        min-height: 40vw !important;
    }

    @media (max-width: 600px) {
        min-height: 85vw !important;
    }
`;

const StyledSkeleton = styled(Skeleton)`
    height: 22.5vw !important;
    max-height: 25rem !important;
    position: relative;
    border-radius: 1rem;

    @media (max-width: 1200px) {
        min-height: 24.5vw;
    }

    @media (max-width: 900px) {
        min-height: 40vw !important;
    }

    @media (max-width: 600px) {
        min-height: 85vw !important;
    }
`;

const StyledImg = styled.img<{ theme?: Theme; willDrop: boolean }>`
    position: absolute;
    border-radius: 1rem;
    width: 100%;
    height: -webkit-fill-available;
    object-position: center center;
    object-fit: cover;
    height: 100%;
    opacity: ${(props) => (props.willDrop ? '0.4' : '1')} !important;
`;

const AvailabilityWrapper = styled.div<{
    inStock: boolean;
    willDrop: boolean;
    pending?: boolean;
}>`
    position: absolute;

    top: 1rem;
    right: 1rem;

    background-color: ${(props) =>
        props.pending
            ? '#dadd10'
            : props.inStock
            ? props.willDrop
                ? '#136dff'
                : '#00ca00'
            : 'red'};

    padding-left: 0.5rem;
    padding-right: 0.5rem;
    padding-top: 0.25rem;
    padding-bottom: 0.25rem;

    border-radius: 0.5rem;
`;

const StyledWapper = styled.div`
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    align-items: center;
`;

const StyledCardContent = styled(CardContent)<{ theme?: Theme }>`
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-direction: column;
    flex-grow: 0;
    background-color: ${(props) => props.theme.palette.background.default};
`;

export const NftCard: React.FC<NftCardProps> = ({ loading, ...props }) => {
    const history = useHistory();
    const [componentLoading, setComponentLoading] = useState(true);

    const [launchTime, setLaunchTime] = useState<number>(
        new Date(props.launchAt!).getTime() - new Date().getTime(),
    );

    useEffect(() => {
        if (props.launchAt) {
            setLaunchTime(
                new Date(props.launchAt).getTime() - new Date().getTime(),
            );
        }
    }, [props.launchAt]);

    useEffect(() => {
        if (props.launchAt) {
            const launchTimeout = setTimeout(() => {
                setLaunchTime(
                    new Date(props.launchAt!).getTime() - new Date().getTime(),
                );
            }, 1000);

            return () => clearTimeout(launchTimeout);
        }
    }, [launchTime]);

    const loadImage = async (imageUrl: string, spinner: boolean = true) => {
        let img;
        // setComponentLoading(spinner);

        const imageLoadPromise = new Promise((resolve) => {
            img = new Image();
            img.onload = resolve;
            img.src = imageUrl;
        });

        await imageLoadPromise;
        // comfort loader
        setTimeout(() => {
            setComponentLoading(false);
        }, 800);
        return img;
    };

    const handleRedirect = (path: string) => {
        history.push(path);
    };

    return !loading ? (
        <StyledCard
            onClick={() => handleRedirect(`/product/${props.id}`)}
            sx={{
                height: props.height,
                display: 'flex',
                position: 'relative',
                flexDirection: 'column',
                width: '100%',
                minHeight: '100%',
                cursor: 'pointer',
                borderRadius: '1rem',
                boxShadow: 'none',
            }}
        >
            <StyledImgWrapper>
                <StyledImg
                    data-object-fit="cover"
                    src={props.thumbnailUri}
                    alt={props.name}
                    willDrop={!launchTime ? false : launchTime > 0}
                    onLoad={() =>
                        props.thumbnailUri ? loadImage(props.thumbnailUri) : undefined
                    }
                    onMouseEnter={e => {
                            if (props.displayUri && e.currentTarget.src != props.displayUri) {
                                e.currentTarget.src = props.displayUri;
                                loadImage(props.displayUri, false);
                            }
                        }
                    }
                    onMouseLeave={e => {
                            if (props.thumbnailUri && e.currentTarget.src != props.thumbnailUri) {
                                e.currentTarget.src = props.thumbnailUri;
                            }
                        }
                    }
                    style={{
                        filter: `${componentLoading ? 'blur(20px)' : 'none'}`,
                    }}
                />
                {componentLoading && (
                    <StyledWapper>
                        <CircularProgress height={2} />
                    </StyledWapper>
                )}
            </StyledImgWrapper>

            <StyledCardContent
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexDirection: 'column',
                    flexGrow: 1,
                }}
            >
                {(props.nftCardMode !== 'user' ||
                    props.ownerStatus === 'pending') && (
                    <AvailabilityWrapper
                        inStock={(props.editionsAvailable ?? 0) > 0}
                        willDrop={!launchTime ? false : launchTime > 0}
                        pending={props.ownerStatus === 'pending'}
                    >
                        <Typography
                            weight="SemiBold"
                            size="body2"
                            color="white"
                        >
                            {props.ownerStatus === 'pending'
                                ? 'Pending'
                                : (props.editionsAvailable ?? 0) > 0
                                ? !launchTime
                                    ? false
                                    : launchTime > 0
                                    ? 'Drop'
                                    : 'In stock'
                                : 'Sold out'}
                        </Typography>
                    </AvailabilityWrapper>
                )}

                <Typography
                    weight="SemiBold"
                    display="initial !important"
                    noWrap
                    size="h3"
                >
                    {props.name}
                </Typography>

                {props.nftCardMode === 'user' &&
                props.ownerStatus === 'pending' ? (
                    <Stack
                        direction="column"
                        sx={{
                            flexFlow: 'wrap',
                        }}
                    >
                        <FlexSpacer />
                        <CustomCircularProgress height={1.2} />
                    </Stack>
                ) : (
                    props.nftCardMode !== 'user' && (
                        <Typography weight="Medium" size="h4">
                            {' '}
                            {props.price ? props.price : '- '}
                        </Typography>
                    )
                )}

                <Box
                    display="flex"
                    flexDirection="row"
                    alignSelf="self-start"
                    width="100%"
                >
                    <Typography weight="Light" size="body">
                        {launchTime &&
                            launchTime > 0 &&
                            `${new Date(launchTime).getDate() - 1} day${
                                new Date(launchTime).getDate() > 2 ? 's' : ''
                            } - ${format(
                                new Date(
                                    launchTime +
                                        new Date().getTimezoneOffset() *
                                            60 *
                                            1000,
                                ),
                                'HH : mm : ss',
                            )}`}
                    </Typography>
                </Box>
            </StyledCardContent>
        </StyledCard>
    ) : (
        <StyledCard
            sx={{
                height: props.height,
                display: 'flex',
                position: 'relative',
                flexDirection: 'column',
                width: '100%',
                minHeight: '100%',
                borderRadius: '1rem',
                boxShadow: 'none',
            }}
        >
            <StyledSkeleton
                variant="rectangular"
                width={'100%'}
                height={'120%'}
            />

            <StyledCardContent
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexDirection: 'column',
                    flexGrow: 1,
                }}
            >
                <StyledBioWrapper>
                    <Typography weight="SemiBold" size="h4">
                        <Skeleton width="7rem" />
                    </Typography>

                    <Box flexGrow="1" marginBottom=".5rem">
                        <Typography weight="Light" size="body">
                            <Skeleton width="5rem" />
                        </Typography>
                    </Box>
                </StyledBioWrapper>

                <Box
                    display="flex"
                    flexDirection="row"
                    alignSelf="self-start"
                    width="100%"
                >
                    <Typography weight="Light" size="body">
                        <Skeleton width="3rem" />
                    </Typography>

                    <Box display="flex" flexDirection="row" marginLeft="auto">
                        <Typography
                            weight="SemiBold"
                            size="h3"
                            marginLeft="auto"
                        >
                            <Skeleton width="3rem" />
                        </Typography>
                    </Box>
                </Box>
            </StyledCardContent>
        </StyledCard>
    );
};
