import useAxios from 'axios-hooks'
import styled from '@emotion/styled'
import FlexSpacer from '../../design-system/atoms/FlexSpacer'
import PageWrapper from '../../design-system/commons/PageWrapper'

import { FC, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CardMedia, Skeleton, Stack, Theme } from '@mui/material'
import { CustomButton } from '../../design-system/atoms/Button'
import { Typography } from '../../design-system/atoms/Typography'
import { INft } from '../../interfaces/artwork'
import { useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import TezosLogo from '../../design-system/atoms/TezosLogo/TezosLogo'

export interface ProductPageProps {
    theme?: Theme
    nftsInCart: INft[]
    setNftsInCart: Function
    listCart: Function
}

const StyledStack = styled(Stack)`
    overflow: hidden;
    width: 100vw;
    max-width: 100rem;
    height: 100%;
    align-items: center;
    margin-bottom: 4rem;
`

interface IProductParam {
    id: string
}

export const ProductPage: FC<ProductPageProps> = ({ ...props }) => {
    const { t } = useTranslation(['translation'])

    const { id } = useParams<IProductParam>()

    const [nftResponse, getNft] = useAxios({
        url: process.env.REACT_APP_API_SERVER_BASE_URL + `/nfts/${id}`,
        method: 'POST',
    })

    const [addToCartResponse, addToCart] = useAxios(
        process.env.REACT_APP_API_SERVER_BASE_URL + `/user/cart/add/`,
        { manual: true },
    )

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
                        props.listCart()
                    }
                })
                .catch((err) => {
                    toast.error(
                        err.response?.data?.message ?? 'An error occured',
                    )
                })
        }
    }

    const [launchTime, setLaunchTime] = useState<number>()

    useEffect(() => {
        if (nftResponse.data) {
            setLaunchTime(new Date(nftResponse.data.launchAt * 1000).getTime() - new Date().getTime())
        }
        if (nftResponse.error) {
        }
    }, [nftResponse])

    useEffect(() => {
        if (nftResponse.data) {
            setTimeout(() => {
                setLaunchTime(new Date(nftResponse.data.launchAt! * 1000).getTime() - new Date().getTime())
            }, 1000)
        }
    }, [launchTime])

    return (
        <PageWrapper>
            <StyledStack direction="column" spacing={3}>
                <FlexSpacer minHeight={8} />

                <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={5}
                    sx={{ width: '100%' }}
                >
                    {nftResponse.loading ? (
                        <Skeleton
                            height="40rem"
                            width="40rem"
                            sx={{ transform: 'none' }}
                        />
                    ) : (
                        <CardMedia
                            component="img"
                            image={nftResponse.data?.dataUri}
                            alt="random"
                            sx={{
                                height: '75vh',
                                minHeight: 400,
                                maxHeight: 1000,
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
                            {nftResponse.loading ? (
                                <Skeleton width="15rem" height="2rem" />
                            ) : (
                                nftResponse.data?.creator
                            )}
                        </Typography>

                        <Typography size="h2" weight="SemiBold">
                            {nftResponse.loading ? (
                                <Skeleton width="10rem" height="2rem" />
                            ) : (
                                nftResponse.data?.name
                            )}
                        </Typography>

                        {/* Headline */}
                        <Typography size="h5" weight="SemiBold" sx={{ pt: 4 }}>
                            {nftResponse.loading ? (
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
                            {nftResponse.loading ? (
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
                            {nftResponse.loading ? (
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
                            {nftResponse.loading ? (
                                <Stack direction="column">
                                    <Skeleton width="40rem" height="1rem" />
                                    <Skeleton width="40rem" height="1rem" />
                                    <Skeleton width="40rem" height="1rem" />
                                    <Skeleton width="10rem" height="1rem" />
                                </Stack>
                            ) : (
                                t('common.lorenIpsum')
                            )}
                        </Typography>
                        <Typography
                            size="body1"
                            weight="SemiBold"
                            sx={{ pt: 4 }}
                        >
                            {nftResponse.loading && (!launchTime || launchTime < 0)
                                ? undefined
                                : t('product.description.part_3')}
                        </Typography>

                        <Typography
                            size="h5"
                            weight="Light"
                            sx={{ pt: 2, mb: 1 }}
                        >
                            {nftResponse.loading
                                ? <Skeleton width="8rem" height="2rem" />
                                : launchTime && launchTime > 0 ? `${new Date(launchTime).getDate()} days - ${new Date(launchTime).getHours()} : ${new Date(launchTime).getMinutes()} : ${new Date(launchTime).getSeconds()}` : 'NFT has been dropped'}
                        </Typography>

                        <Typography
                            size="body1"
                            weight="SemiBold"
                            sx={{ pt: 4 }}
                        >
                            {nftResponse.loading
                                ? undefined
                                : t('product.description.price')}
                        </Typography>

                        <Typography
                            size="h5"
                            weight="Light"
                            sx={{ pt: 2, mb: 1 }}
                        >
                            {nftResponse.loading ? undefined : (
                                <>
                                    {nftResponse.data?.price}
                                    <TezosLogo width="18px" margin="0 0.2rem" />
                                </>
                            )}
                        </Typography>

                        <FlexSpacer minHeight={2} />

                        <CustomButton
                            size="medium"
                            onClick={() => handleAddToBasket()}
                            label={
                                launchTime! > 0 ?
                                    'Not dropped yet'
                                    :
                                    props.nftsInCart.filter(
                                        (nft) =>
                                            Number(nft.id) === nftResponse.data?.id,
                                    ).length > 0
                                        ? 'Already in cart'
                                        : t('product.button_1')
                            }
                            disabled={
                                nftResponse.loading ||
                                props.nftsInCart.filter(
                                    (nft) =>
                                        Number(nft.id) === nftResponse.data?.id,
                                ).length > 0 ||
                                Number(nftResponse.data?.editionsAvailable) ===
                                0 ||
                                (launchTime! > 0)
                            }
                        />
                    </Stack>
                </Stack>
            </StyledStack>
        </PageWrapper>
    )
}

export default ProductPage
