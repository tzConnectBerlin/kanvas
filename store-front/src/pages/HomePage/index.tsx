import styled from '@emotion/styled'
import FlexSpacer from '../../design-system/atoms/FlexSpacer'
import PageWrapper from '../../design-system/commons/PageWrapper'
import { FC } from 'react'
import { Animated } from 'react-animated-css'
import { Stack, Theme } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { Typography } from '../../design-system/atoms/Typography'
import NftGrid from '../../design-system/organismes/NftGrid'
import Hero from '../../design-system/organismes/Hero'
import mockNft from '../../_mocks/mockNft'
import { KukaiEmbed } from 'kukai-embed'
import { BeaconWallet } from '@taquito/beacon-wallet'
import { CustomButton } from '../../design-system/atoms/Button'
import useAxios from 'axios-hooks'

import { useHistory } from 'react-router'

interface HomePageProps {
    theme?: Theme
    handleCloseModal?: Function
    beaconWallet?: BeaconWallet
    embedKukai?: KukaiEmbed
    setSignedPayload?: Function
}
const StyledStack = styled(Stack)`
    overflow: hidden;
    width: 100vw;
    max-width: 100rem;
    height: 100%;
    align-items: center;
    margin-bottom: 4rem;
    max-width: 1536px;

    @media (max-width: 650px) {
        padding: 0 1.5rem 1rem;
    }
`

const LinkStyled = styled(CustomButton)<{ theme?: Theme }>`
    outline: none;
    background: transparent;
    padding: 0;
    min-width: 0;
    font-size: 1.15rem;
    color: ${(props) => props.theme.palette.text.primary};

    &:hover {
        outline: none !important;
        background: transparent;
        text-decoration: underline;
        text-decoration-color: currentcolor;
        padding: 0;
        min-width: 0;
        font-family: 'Poppins SemiBold';
        font-weight: 400;
    }
`

const StyledAnimated = styled(Animated)`
    width: 100%;
`

const HomePage: FC<HomePageProps> = () => {
    const { t } = useTranslation(['translation'])

    const history = useHistory()

    const [sliderNftResponse] = useAxios({
        url: process.env.REACT_APP_API_SERVER_BASE_URL + '/nfts?',
        withCredentials: true,
        params: {
            pageSize: 4,
            orderBy: 'id',
            order: 'desc',
        },
        headers: {
            Authorization: `Bearer ${localStorage.getItem('Kanvas - Bearer')}`,
        },
    })

    const [FeaturedNftsResponse] = useAxios({
        url: process.env.REACT_APP_API_SERVER_BASE_URL + '/nfts?',
        withCredentials: true,
        params: {
            pageSize: 8,
            orderBy: 'views',
            order: 'desc',
        },
        headers: {
            Authorization: `Bearer ${localStorage.getItem('Kanvas - Bearer')}`,
        },
    })

    return (
        <PageWrapper>
            <StyledStack>
                <FlexSpacer minHeight={12} />

                <StyledAnimated
                    animationIn="fadeIn"
                    animationOut="fadeOut"
                    isVisible={true}
                >
                    <Hero
                        sliderLoading={sliderNftResponse.loading}
                        sliderNfts={sliderNftResponse.data?.nfts ?? []}
                    />

                    <FlexSpacer minHeight={7} />

                    <Stack
                        direction="row"
                        sx={{ alignItems: 'end', marginBottom: '1.5rem' }}
                    >
                        <Typography
                            size="h2"
                            weight="SemiBold"
                            sx={{ pt: 2, mb: 1 }}
                        >
                            {t('home.nfts.headline')}
                        </Typography>

                        <FlexSpacer />

                        <LinkStyled
                            size="small"
                            textSize="Light"
                            label={t('home.nfts.link')}
                            onClick={() => history.push(`/store`)}
                        />
                    </Stack>

                    <NftGrid
                        nfts={FeaturedNftsResponse.data?.nfts}
                        loading={FeaturedNftsResponse.loading}
                        emptyMessage={'No Featured NFTs yet'}
                        emptyLink={'See entire collection.'}
                    />
                </StyledAnimated>

                <FlexSpacer minHeight={2} />
            </StyledStack>
        </PageWrapper>
    )
}

export default HomePage
