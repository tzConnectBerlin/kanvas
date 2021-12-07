import useAxios from 'axios-hooks';
import styled from '@emotion/styled';
import FlexSpacer from '../../design-system/atoms/FlexSpacer';
import PageWrapper from '../../design-system/commons/PageWrapper';

import { FC, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, CardMedia, Skeleton, Stack, Theme } from '@mui/material';
import { CustomButton } from '../../design-system/atoms/Button';
import { Typography } from '../../design-system/atoms/Typography';
import { INft } from '../../interfaces/artwork';
import { useHistory, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import TezosLogo from '../../design-system/atoms/TezosLogo/TezosLogo';
import { ICategory } from '../../interfaces/category';
import CircularProgress from '../../design-system/atoms/CircularProgress';

export interface ProductPageProps {
    theme?: Theme;
    nftsInCart: INft[];
    setNftsInCart: Function;
    listCart: Function;
}

const StyledStack = styled(Stack)`
    overflow: hidden;
    width: 100vw;
    max-width: 100rem;
    height: 100%;
    align-items: center;
    margin-bottom: 4rem;
`;
const StyledCardMedia = styled(CardMedia)<{ component?: string; alt: string }>`
    @media (min-width: 900px) {
        width: 50%;
        height: 50rem;
    }

    @media (min-width: 1440px) {
        width: 1000%;
        height: auto;
    }
`;

interface IProductParam {
    id: string;
}

export const ProductPage: FC<ProductPageProps> = ({ ...props }) => {
    const { t } = useTranslation(['translation']);

    const history = useHistory();
    const { id } = useParams<IProductParam>();

    const [nftResponse, getNft] = useAxios({
        url: process.env.REACT_APP_API_SERVER_BASE_URL + `/nfts/${id}`,
        method: 'POST',
    },
        { manual: true }
    );

    const [addToCartResponse, addToCart] = useAxios(
        process.env.REACT_APP_API_SERVER_BASE_URL + `/user/cart/add/`,
        { manual: true },
    );

    const [comfortLoader, setComfortLoader] = useState<boolean>(true)

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
        const comfortTrigger = setTimeout(() => {
            getNft()
            setComfortLoader(false)
        }, 800);
    }, [])

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
        <PageWrapper>
            <StyledStack direction="column" spacing={3}>
                <FlexSpacer minHeight={8} />

                <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={5}
                    sx={{ width: '100%', height: '75vh' }}
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
                                alignItems: 'center'
                            }}
                        >
                            <CircularProgress height={2}/>
                        </Box>
                    ) : (
                        <StyledCardMedia
                            component="img"
                            image={nftResponse.data?.dataUri}
                            alt="random"
                            sx={{
                                height: '75vh',
                                minHeight: 400,
                                maxHeight: '75vh',
                                maxWidth: 1000,
                            }}
                        />
                    )}

                    <Stack
                        direction="column"
                        sx={{ position: 'relative', padding: '1rem' }}
                    >
                        {/* Headline */}

                        <Typography size="h4" weight="SemiBold">
                            {nftResponse.loading || comfortLoader ? (
                                <Skeleton width="15rem" height="2rem" />
                            ) : (
                                nftResponse.data?.creator
                            )}
                        </Typography>

                        <Typography size="h2" weight="SemiBold">
                            {nftResponse.loading || comfortLoader ? (
                                <Skeleton width="10rem" height="2rem" />
                            ) : (
                                nftResponse.data?.name
                            )}
                        </Typography>

                        {/* Headline */}
                        <Typography size="h5" weight="SemiBold" sx={{ pt: 4 }}>
                            {nftResponse.loading || comfortLoader ? (
                                <Skeleton width="10rem" height="2rem" />
                            ) : (
                                t('product.description.part_1')
                            )}
                        </Typography>
                        <Typography
                            size="h5"
                            weight="Light"
                            sx={{ pt: 2, mb: 1 }}
                        >
                            {nftResponse.loading || comfortLoader ? (
                                <Stack direction="column">
                                    <Skeleton width="40rem" height="1rem" />
                                    <Skeleton width="40rem" height="1rem" />
                                    <Skeleton width="40rem" height="1rem" />
                                    <Skeleton width="10rem" height="1rem" />
                                </Stack>
                            ) : (
                                t('common.lorenIpsumShort')
                            )}
                        </Typography>

                        <Typography
                            size="body"
                            weight="SemiBold"
                            sx={{ pt: 4 }}
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
                                'No description provided'
                            )}
                        </Typography>
                        {
                            launchTime && launchTime > 0 &&
                            <>
                                <Typography
                                    size="body1"
                                    weight="SemiBold"
                                    sx={{ pt: 4 }}
                                >
                                    {nftResponse.loading || comfortLoader &&
                                        (!launchTime || launchTime < 0)
                                        ? undefined
                                        : t('product.description.part_3')}
                                </Typography>

                                <Typography
                                    size="h5"
                                    weight="Light"
                                    sx={{ pt: 2, mb: 1 }}
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
                                        'NFT has been dropped'
                                    )}
                                </Typography>
                            </>

                        }
                        <Typography
                            size="body1"
                            weight="SemiBold"
                            sx={{ pt: 4 }}
                        >
                            {nftResponse.loading || comfortLoader
                                ? undefined
                                : t('product.description.categories')}
                        </Typography>

                        <Typography
                            size="h5"
                            weight="Light"
                            sx={{ pt: 2, mb: 1 }}
                        >
                            {nftResponse.loading || comfortLoader ? undefined : (
                                <>
                                    {nftResponse.data?.categories.map(
                                        (category: ICategory) => (
                                            <Typography
                                                size="body1"
                                                weight="Medium"
                                                type="link"
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

                        <Stack direction="row" spacing={10}>
                            <Stack direction="column">
                                <Typography
                                    size="body1"
                                    weight="SemiBold"
                                    sx={{ pt: 4 }}
                                >
                                    {nftResponse.loading || comfortLoader
                                        ? undefined
                                        : t('product.description.editions')}
                                </Typography>

                                <Typography
                                    size="h5"
                                    weight="Light"
                                    sx={{ pt: 2, mb: 1 }}
                                >
                                    {nftResponse.loading || comfortLoader
                                        ? undefined
                                        : nftResponse.data?.editionsAvailable +
                                        '/' +
                                        nftResponse.data?.editionsSize}
                                </Typography>
                            </Stack>
                            <Stack direction="column">
                                <Typography
                                    size="body1"
                                    weight="SemiBold"
                                    sx={{ pt: 4 }}
                                >
                                    {nftResponse.loading || comfortLoader
                                        ? undefined
                                        : t('product.description.price')}
                                </Typography>

                                <Typography
                                    size="h5"
                                    weight="Light"
                                    sx={{ pt: 2, mb: 1 }}
                                >
                                    {nftResponse.loading || comfortLoader ? undefined : (
                                        <>
                                            {nftResponse.data?.price}
                                            <TezosLogo width="18px" margin="0 0.2rem" />
                                        </>
                                    )}
                                </Typography>
                            </Stack>
                        </Stack>

                        <FlexSpacer minHeight={2} />

                        <CustomButton
                            size="medium"
                            onClick={() => handleAddToBasket()}
                            loading={addToCartResponse.loading}
                            label={
                                launchTime! > 0
                                    ? 'Not dropped yet'
                                    : props.nftsInCart.filter(
                                        (nft) =>
                                            Number(nft.id) ===
                                            nftResponse.data?.id,
                                    ).length > 0
                                        ? 'Already in cart'
                                        : t('product.button_1')
                            }
                            disabled={
                                nftResponse.loading || comfortLoader ||
                                props.nftsInCart.filter(
                                    (nft) =>
                                        Number(nft.id) === nftResponse.data?.id,
                                ).length > 0 ||
                                Number(nftResponse.data?.editionsAvailable) ===
                                0 ||
                                launchTime! > 0
                            }
                        />
                    </Stack>
                </Stack>
            </StyledStack>
        </PageWrapper>
    );
};

export default ProductPage;
