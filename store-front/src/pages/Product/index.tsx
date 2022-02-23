import useAxios from 'axios-hooks';
import styled from '@emotion/styled';
import FlexSpacer from '../../design-system/atoms/FlexSpacer';
import PageWrapper from '../../design-system/commons/PageWrapper';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import { FC, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, CardMedia, Skeleton, Stack, Theme } from '@mui/material';
import { CustomButton } from '../../design-system/atoms/Button';
import { Typography } from '../../design-system/atoms/Typography';
import { INft } from '../../interfaces/artwork';
import { useHistory, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ICategory } from '../../interfaces/category';
import CircularProgress from '../../design-system/atoms/CircularProgress';
import TezosLogo from '../../design-system/atoms/TezosLogo/TezosLogo';

export interface ProductPageProps {
    theme?: Theme;
    nftsInCart: INft[];
    setNftsInCart: Function;
    listCart: Function;
}

const StyledA = styled.a<{ theme?: Theme }>`
    color: ${(props) => props.theme.palette.primary.dark};
    text-decoration: none;

    :hover {
        text-decoration: underline;
    }
`;

const StytledPageWrapper = styled(PageWrapper)`
    align-items: center;
`;

const StyledStack = styled(Stack)`
    overflow: hidden;
    width: 100vw;
    max-width: 100rem;
    align-items: center;
    margin-bottom: 4rem;
`;

const StyledMetadataStack = styled(Stack)`
    min-width: 100%;
    margin-top: 3rem !important;
    margin-left: 0 !important;

    @media (min-width: 769px) {
        min-width: 30%;
        max-width: 30%;

        margin-top: 0  !important;
        margin-left: 3rem !important;
    }

    @media (min-width: 1440px) {
        /* width: 30%; */
        height: auto;
    }
`;

const StyledCardMedia = styled(CardMedia)<{ component?: string; alt: string }>`
    object-fit: contain;
    min-height: 100%;

    @media (min-width: 768px) {
        max-height: 43rem;
    }

    @media (min-width: 1440px) {
        max-height: 65vh;
    }
`;

const StyledWrapperIcon = styled.div<{ theme?: Theme }>`
    background-color: ${(props) => props.theme.palette.background.paper};
    border-radius: 2rem;
    margin: 0 !important;
    height: 2.5rem;
    width: 2.5rem;
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    bottom: 1rem;
    left: 1rem;
    transition: scale 0.2s;

    :hover {
        cursor: pointer;
        scale: 1.075;
    }

    :active {
        cursor: pointer;
        scale: 0.98;
    }
`;

const StyledFullscreenIcon = styled(FullscreenIcon)<{ theme?: Theme }>`
    margin: 0 !important;
    height: 1.8rem;
    width: 1.8rem;
    color: ${(props) => props.theme.palette.text.primary};
`;

const WrapperFullScreen = styled.div<{ open: boolean }>`
    visibility: ${(props) => (props.open ? 'visivble' : 'hidden')};
    display: flex;
    justify-content: center;
    align-items: center;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    position: fixed;
    z-index: 20;

    transition: visibility 0.3s;
`;

const FullScreenView = styled.div<{ theme?: Theme; open: boolean }>`
    position: absolute;
    background-color: ${(props) => props.theme.palette.background.default};
    width: 100%;
    height: 100%;
    z-index: 21;
    opacity: ${(props) => (props.open ? '1 !important' : 0)};
    transition: opacity 0.4s;
`;

const StyledBox = styled(Box)`
    @media (min-width: 600px) {
        width: 50%;
    }

    @media (min-width: 900px) {
        width: 40%;
    }
`;

const StyledImage = styled.img<{ open: boolean }>`
    max-height: 90vh;
    max-width: 90vw;
    opacity: ${(props) => (props.open ? '1 !important' : 0)};
    z-index: 22;
    object-fit: contain;
    height: 100%;
    width: 100%;
    transition: opacity 0.4s;
    border-radius: 1rem;

    @media (min-width: 600px) {
        width: 50%;
        margin: 0 auto;
    }
`;

const StyledCustomButton = styled(CustomButton)`
    margin-top: 3rem;

    @media (min-width: 768px) {
        margin-top: auto;
    }
`;

const StyledWrapper = styled(Stack)`
    @media (min-width: 786px) {
        margin-top: auto;
    }
`;
const StyledContainer = styled(Stack)`
    max-width: fit-content;
    margin-bottom: auto;
    max-height: fit-content;
    position: relative;
`;

interface IProductParam {
    id: string;
}

export const ProductPage: FC<ProductPageProps> = ({ ...props }) => {
    const { t } = useTranslation(['translation']);

    const history = useHistory();
    const { id } = useParams<IProductParam>();

    const [nftResponse, getNft] = useAxios(
        {
            url: process.env.REACT_APP_API_SERVER_BASE_URL + `/nfts/${id}`,
            method: 'POST',
        },
        { manual: true },
    );

    const [addToCartResponse, addToCart] = useAxios(
        process.env.REACT_APP_API_SERVER_BASE_URL + `/user/cart/add/`,
        { manual: true },
    );

    const [comfortLoader, setComfortLoader] = useState<boolean>(true);
    const [fullScreenView, setFullScreenView] = useState<boolean>(false);

    const handleAddToBasket = () => {
        if (nftResponse.data) {
            addToCart({
                url:
                    process.env.REACT_APP_API_SERVER_BASE_URL +
                    `/users/cart/add/` +
                    nftResponse.data.id.toString(),
                method: 'POST',
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${localStorage.getItem(
                        'Kanvas - Bearer',
                    )}`,
                },
            })
                .then((res) => {
                    if (res.status === 201) {
                        props.listCart();
                    }
                })
                .catch((err) => {
                    toast.error(
                        err.response?.data?.message ?? 'An error occured',
                    );
                });
        }
    };

    const [launchTime, setLaunchTime] = useState<number>();

    const nagivateTo = (pathname: string) => {
        history.push(pathname);
    };

    useEffect(() => {
        window.scrollTo(0, 0);
        const comfortTrigger = setTimeout(() => {
            getNft();
            setComfortLoader(false);
        }, 800);
    }, []);

    useEffect(() => {
        if (nftResponse.data) {
            setLaunchTime(
                new Date(nftResponse.data.launchAt * 1000).getTime() -
                    new Date().getTime(),
            );
        }
        if (nftResponse.error) {
        }
    }, [nftResponse]);

    useEffect(() => {
        if (nftResponse.data) {
            setTimeout(() => {
                setLaunchTime(
                    new Date(nftResponse.data.launchAt! * 1000).getTime() -
                        new Date().getTime(),
                );
            }, 1000);
        }
    }, [launchTime]);

    return (
        <StytledPageWrapper>
            <WrapperFullScreen open={fullScreenView}>
                <StyledImage
                    src={nftResponse.data?.displayUri}
                    alt={`Nft ${nftResponse.data?.name} image`}
                    onClick={
                        fullScreenView
                            ? () => {
                                  setFullScreenView(false);
                                  document.body.style.overflow = '';
                              }
                            : () => {}
                    }
                    open={fullScreenView}
                />
                <FullScreenView open={fullScreenView}></FullScreenView>
            </WrapperFullScreen>
            <StyledStack
                direction="column"
                spacing={3}
                sx={{
                    position: 'relative',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '45rem',
                }}
            >
                <StyledWrapper
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={5}
                    sx={{
                        width: '100%',
                        minHeight: '20rem',
                        marginTop: '7rem',
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                    }}
                >
                    {nftResponse.loading || comfortLoader ? (
                        <Box
                            sx={{
                                height: '75vh',
                                width: '100%',
                                minHeight: 400,
                                maxHeight: 1000,
                                maxWidth: 1000,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            <CircularProgress height={2} />
                        </Box>
                    ) : (
                        <StyledBox
                            sx={{
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'flex-end',
                            }}
                        >
                            <StyledContainer sx={{ maxWidth: 'fit-content' }}>
                                <StyledCardMedia
                                    component="img"
                                    image={nftResponse.data?.displayUri}
                                    alt={`Nft ${nftResponse.data?.name}`}
                                />
                                <StyledWrapperIcon
                                    role="button"
                                    aria-labelledBy="Button to expand image"
                                    onClick={
                                        !fullScreenView
                                            ? () => {
                                                  setFullScreenView(true);
                                                  document.body.style.overflow =
                                                      'hidden';
                                              }
                                            : () => {}
                                    }
                                >
                                    <StyledFullscreenIcon />
                                </StyledWrapperIcon>
                            </StyledContainer>
                        </StyledBox>
                    )}

                    <StyledMetadataStack
                        direction="column"
                        sx={{ position: 'relative' }}
                    >
                        {/* Headline */}

                        <Typography
                            size="h4"
                            weight="SemiBold"
                            aria-label="Subtitle - nft creator"
                        >
                            {nftResponse.loading || comfortLoader ? (
                                <Skeleton width="15rem" height="2rem" />
                            ) : (
                                nftResponse.data?.creator
                            )}
                        </Typography>

                        <Typography
                            size="h2"
                            weight="SemiBold"
                            aria-label="Title - nft name"
                        >
                            {nftResponse.loading || comfortLoader ? (
                                <Skeleton width="10rem" height="2rem" />
                            ) : (
                                nftResponse.data?.name
                            )}
                        </Typography>

                        <Typography
                            size="body"
                            weight="SemiBold"
                            sx={{ pt: 4 }}
                            color="#757575"
                            aria-label="Nft description"
                        >
                            {nftResponse.loading || comfortLoader ? (
                                <Skeleton width="10rem" height="2rem" />
                            ) : (
                                t('product.description.part_2')
                            )}
                        </Typography>
                        <Typography
                            size="h5"
                            weight="Light"
                            sx={{ pt: 2, mb: 1 }}
                            aria-label="NFT without description"
                        >
                            {nftResponse.loading || comfortLoader ? (
                                <Stack direction="column">
                                    <Skeleton width="40rem" height="1rem" />
                                    <Skeleton width="40rem" height="1rem" />
                                    <Skeleton width="40rem" height="1rem" />
                                    <Skeleton width="10rem" height="1rem" />
                                </Stack>
                            ) : (
                                nftResponse.data?.description ??
                                t('product.noDescription')
                            )}
                        </Typography>
                        {launchTime && launchTime > 0 && (
                            <>
                                <Typography
                                    size="body1"
                                    weight="SemiBold"
                                    sx={{ pt: 4 }}
                                    color="#757575"
                                    aria-label="NFT description new paragraph"
                                >
                                    {nftResponse.loading ||
                                    (comfortLoader &&
                                        (!launchTime || launchTime < 0))
                                        ? undefined
                                        : t('product.description.part_3')}
                                </Typography>

                                <Typography
                                    size="h5"
                                    weight="Light"
                                    sx={{ pt: 2, mb: 1 }}
                                    aria-label="NFT ramaining to drop"
                                >
                                    {nftResponse.loading || comfortLoader ? (
                                        <Skeleton width="8rem" height="2rem" />
                                    ) : launchTime && launchTime > 0 ? (
                                        `${new Date(
                                            launchTime,
                                        ).getDate()} days - ${new Date(
                                            launchTime,
                                        ).getHours()} : ${new Date(
                                            launchTime,
                                        ).getMinutes()} : ${new Date(
                                            launchTime,
                                        ).getSeconds()}`
                                    ) : (
                                        t('product.dropped')
                                    )}
                                </Typography>
                            </>
                        )}
                        <Typography
                            size="body1"
                            weight="SemiBold"
                            sx={{ pt: 4 }}
                            color="#757575"
                            aria-label="subtitle - NFT category "
                        >
                            {nftResponse.loading || comfortLoader
                                ? undefined
                                : t('product.description.categories')}
                        </Typography>

                        <Typography
                            size="h5"
                            weight="Light"
                            sx={{ pt: 2, mb: 1 }}
                            aria-label="NFT catrgory"
                        >
                            {nftResponse.loading ||
                            comfortLoader ? undefined : (
                                <>
                                    {nftResponse.data?.categories.map(
                                        (category: ICategory) => (
                                            <Typography
                                                size="body1"
                                                weight="Medium"
                                                type="link"
                                                role="link"
                                                onClick={() =>
                                                    nagivateTo(
                                                        `/store?categories=${category.id}`,
                                                    )
                                                }
                                            >
                                                {nftResponse.data?.categories.indexOf(
                                                    category,
                                                ) === 0
                                                    ? category.name
                                                    : `, ${category.name}`}
                                            </Typography>
                                        ),
                                    )}
                                </>
                            )}
                        </Typography>
                        <Typography
                            size="body1"
                            weight="SemiBold"
                            sx={{ pt: 4 }}
                            color="#757575"
                            aria-label="Subtitle - NFT ipfs"
                        >
                            {nftResponse.loading || comfortLoader
                                ? undefined
                                : t('product.description.ipfs')}
                        </Typography>

                        <Typography
                            size="h5"
                            weight="Light"
                            sx={{ pt: 2, mb: 1 }}
                            aria-label="NFT ipfs"
                        >
                            {nftResponse.loading ||
                            comfortLoader ? undefined : (
                                <Typography
                                    size="body1"
                                    weight="Medium"
                                    type="link"
                                >
                                    <StyledA
                                        href={`https://cloudflare-ipfs.com/ipfs/${nftResponse.data?.ipfsHash.slice(
                                            'ipfs://'.length,
                                        )}`}
                                        target="_blank"
                                        role="link"
                                        aria-labelledBy="link to ipfs website"
                                    >
                                        {nftResponse.data?.ipfsHash}
                                    </StyledA>
                                </Typography>
                            )}
                        </Typography>
                        <Stack direction="row" spacing={10}>
                            <Stack direction="column">
                                <Typography
                                    size="body1"
                                    weight="SemiBold"
                                    sx={{ pt: 4 }}
                                    color="#757575"
                                    aria-label="Subtitle - NFT editions availability"
                                >
                                    {nftResponse.loading || comfortLoader
                                        ? undefined
                                        : t('product.description.editions')}
                                </Typography>

                                <Typography
                                    size="h5"
                                    weight="SemiBold"
                                    sx={{ pt: 2, mb: 1 }}
                                    aria-label={`NFT editions ${
                                        nftResponse.data
                                            ? 'available'
                                            : 'unavailable'
                                    }`}
                                >
                                    {nftResponse.loading ||
                                    comfortLoader ? undefined : (
                                        <>
                                            {nftResponse.data ? (
                                                <>
                                                    {nftResponse.data
                                                        ?.editionsAvailable +
                                                        '/' +
                                                        nftResponse.data
                                                            ?.editionsSize}
                                                </>
                                            ) : (
                                                '- '
                                            )}{' '}
                                        </>
                                    )}
                                </Typography>
                            </Stack>
                            <Stack direction="column">
                                <Typography
                                    size="body1"
                                    weight="SemiBold"
                                    sx={{ pt: 4 }}
                                    color="#757575"
                                    aria-label="Subtitle - NFT price"
                                >
                                    {nftResponse.loading || comfortLoader
                                        ? undefined
                                        : t('product.description.price')}
                                </Typography>

                                <Typography
                                    size="h5"
                                    weight="SemiBold"
                                    sx={{ pt: 2, mb: 1, fontWeight: 'bold' }}
                                    aria-label={`NFT price ${
                                        nftResponse.data
                                            ? 'available'
                                            : 'unavailable'
                                    }`}
                                >
                                    {nftResponse.loading ||
                                    comfortLoader ? undefined : (
                                        <>
                                            {nftResponse.data ? (
                                                <>
                                                    {nftResponse.data?.price}
                                                    <TezosLogo
                                                        width={15}
                                                        margin="0 0.2rem"
                                                    />
                                                </>
                                            ) : (
                                                '- '
                                            )}{' '}
                                        </>
                                    )}
                                </Typography>
                            </Stack>
                        </Stack>

                        <StyledCustomButton
                            size="medium"
                            onClick={() => handleAddToBasket()}
                            loading={addToCartResponse.loading}
                            role="button"
                            aria-label={t('product.add')} // Add to cart
                            label={
                                launchTime! > 0
                                    ? t('product.notDropped')
                                    : props.nftsInCart.filter(
                                          (nft) =>
                                              Number(nft.id) ===
                                              nftResponse.data?.id,
                                      ).length > 0
                                    ? t('product.already')
                                    : t('product.button_1')
                            }
                            disabled={
                                nftResponse.loading ||
                                comfortLoader ||
                                props.nftsInCart.filter(
                                    (nft) =>
                                        Number(nft.id) === nftResponse.data?.id,
                                ).length > 0 ||
                                Number(nftResponse.data?.editionsAvailable) ===
                                    0 ||
                                launchTime! > 0
                            }
                        />
                    </StyledMetadataStack>
                </StyledWrapper>
            </StyledStack>
        </StytledPageWrapper>
    );
};

export default ProductPage;
