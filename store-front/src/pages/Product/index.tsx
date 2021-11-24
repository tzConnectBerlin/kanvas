import useAxios from 'axios-hooks'
import styled from '@emotion/styled'
import FlexSpacer from '../../design-system/atoms/FlexSpacer'
import PageWrapper from '../../design-system/commons/PageWrapper'

import { FC, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { CardMedia, Skeleton, Stack, Theme } from '@mui/material'
import { CustomButton } from '../../design-system/atoms/Button'
import { Typography } from '../../design-system/atoms/Typography'
import { INft } from '../../interfaces/artwork'
import { useParams } from 'react-router-dom'
import { toast } from 'react-toastify'

export interface ProductPageProps {
    theme?: Theme
    nftsInCart: INft[]
    setNftsInCart: Function
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

    const [nftResponse, getNft] = useAxios(
        process.env.REACT_APP_API_SERVER_BASE_URL + `/nfts/${id}`,
    )

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
                withCredentials: true,
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
            })
                .then((res) => {
                    if (res.status === 201) {
                        props.setNftsInCart([
                            ...props.nftsInCart,
                            nftResponse.data,
                        ])
                    }
                })
                .catch((err) => {
                    toast.error(err.response?.data?.message ?? 'An error occured')
                })
        }
    }

    useEffect(() => {
        if (nftResponse.error) {
            //
        }
    }, [nftResponse])

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
                            image={nftResponse.data.dataUri}
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
                            {nftResponse.loading
                                ? undefined
                                : t('product.description.part_3')}
                        </Typography>

                        <Typography
                            size="h5"
                            weight="Light"
                            sx={{ pt: 2, mb: 1 }}
                        >
                            {nftResponse.loading ? undefined : nftResponse.data?.startDate}
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
                            {nftResponse.loading
                                ? undefined
                                : `${nftResponse.data?.price} ꜩ`}
                        </Typography>

                        <FlexSpacer minHeight={2} />

                        <CustomButton
                            size="medium"
                            onClick={() => handleAddToBasket()}
                            label={t('product.button_1')}
                            disabled={nftResponse.loading}
                        />
                    </Stack>
                </Stack>
            </StyledStack>
        </PageWrapper>
    )
}

export default ProductPage
