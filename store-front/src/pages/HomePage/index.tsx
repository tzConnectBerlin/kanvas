import styled from '@emotion/styled'
import FlexSpacer from '../../design-system/atoms/FlexSpacer'
import PageWrapper from '../../design-system/commons/PageWrapper'
import { FC } from 'react'
import { Animated } from 'react-animated-css'
import { Container, Stack, Theme } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { Typography } from '../../design-system/atoms/Typography'
import NftGrid from '../../design-system/organismes/NftGrid'
import Hero from '../../design-system/organismes/Hero'
import mockNft from '../../_mocks/mockNft'
import { KukaiEmbed } from 'kukai-embed'
import { BeaconWallet } from '@taquito/beacon-wallet'
import { CustomButton } from '../../design-system/atoms/Button'

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

const HomePage: FC<HomePageProps> = () => {
    const { t } = useTranslation(['translation'])

    return (
        <PageWrapper>
            <StyledStack>
                <FlexSpacer minHeight={12} />

                <Animated
                    animationIn="fadeIn"
                    animationOut="fadeOut"
                    isVisible={true}
                >
                    <Hero />

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
                            href="/store"
                        />
                    </Stack>

                    <NftGrid
                        nfts={mockNft}
                        emptyMessage={'No Nfts in collection yet'}
                        emptyLink={'Click here to buy some in the store.'}
                    />
                </Animated>

                <FlexSpacer minHeight={2} />
            </StyledStack>
        </PageWrapper>
    )
}

export default HomePage
