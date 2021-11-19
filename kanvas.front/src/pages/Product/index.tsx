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

export interface ProductPageProps {
  theme?: Theme
  addToBasket: Function
}

const StyledStack = styled(Stack)`
  overflow: hidden;
  width: 100vw;
  max-width: 100rem;
  height: 100%;
  align-items: center;
  margin-bottom: 4rem;
`

const data: INft = {
  id: 1,
  name: 'AD # 8210',
  creator: 'Aurélia Durand',
  ipfsHash:
    'https://uploads-ssl.webflow.com/60098420fcf354eb258f25c5/60098420fcf3542cf38f287b_Illustrations%202019-37.jpg',
  price: 20,
  dataUri:
    'https://uploads-ssl.webflow.com/60098420fcf354eb258f25c5/60098420fcf3542cf38f287b_Illustrations%202019-37.jpg',
  startDate: '12:12:43:00',
}

interface IProductParam {
  id: string
}

export const ProductPage: FC<ProductPageProps> = ({ ...props }) => {
  const { t } = useTranslation(['translation'])

  const { id } = useParams<IProductParam>()

  const [nftResponse, getNft] = useAxios(
    process.env.REACT_APP_API_SERVER_BASE_URL + `/nfts/${id}`,
  )

  const handleAddToBasket = () => {
    if (nftResponse.data) {
      props.addToBasket(nftResponse.data.id)
    }
  }

  useEffect(() => {
    if (nftResponse.error) {
      // debugger
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
            <Skeleton height="40rem" width="40rem" sx={{ transform: 'none' }} />
          ) : (
            <CardMedia
              component="img"
              image={data.dataUri}
              // image={nftResponse.data.dataUri}
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
            <Typography size="h5" weight="Light" sx={{ pt: 2, mb: 1 }}>
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

            <Typography size="body" weight="SemiBold" sx={{ pt: 4 }}>
              {nftResponse.loading ? (
                <Skeleton width="10rem" height="2rem" />
              ) : (
                t('product.description.part_2')
              )}
            </Typography>
            <Typography size="h5" weight="Light" sx={{ pt: 2, mb: 1 }}>
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
            <Typography size="body1" weight="SemiBold" sx={{ pt: 4 }}>
              {nftResponse.loading
                ? undefined
                : t('product.description.part_3')}
            </Typography>

            <Typography size="h5" weight="Light" sx={{ pt: 2, mb: 1 }}>
              {nftResponse.loading ? undefined : data.startDate}
            </Typography>

            <Typography size="body1" weight="SemiBold" sx={{ pt: 4 }}>
              {nftResponse.loading ? undefined : t('product.description.price')}
            </Typography>

            <Typography size="h5" weight="Light" sx={{ pt: 2, mb: 1 }}>
              {nftResponse.loading ? undefined : `${data.price} ꜩ`}
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
