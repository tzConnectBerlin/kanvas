import { FC, useEffect } from 'react'
import {
    Box,
    CardMedia,
    Skeleton,
    useMediaQuery,
    useTheme,
    Paper,
    Card,
} from '@mui/material'
import useAxios from 'axios-hooks'
import { Typography } from '../../../design-system/atoms/Typography'
import { CustomButton } from '../../../design-system/atoms/Button'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import Carousel from 'react-material-ui-carousel'
import { Animated } from 'react-animated-css'
import { styled } from '@mui/material/styles'
import mockCarousel from '../../../_mocks/mockCarousel'
import { DART_REDIRECT_URI } from '../../../global'

export interface SliderProps {
    sx?: any
    loading?: boolean
    selectedTheme?: string
}

interface IProductParam {
    id: string
}

const StyledBox = styled(Animated)`
    display: flex;
    flex-direction: column;
    position: absolute;
    width: -webkit-fill-available;
    min-height: 90px;
    padding: 2rem;
    place-content: space-between;
    align-items: start;
    bottom: 0;
    right: 0;
    left: 0;
    background-color: rgba(0, 0, 0, 0.05);
    backdrop-filter: blur(8px) saturate(100%) contrast(45%) brightness(80%);
`

export const Slider: FC<SliderProps> = ({ ...props }) => {
    const { t } = useTranslation(['translation'])

    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('md'))

    const { id } = useParams<IProductParam>()
    // const [nftResponse, getNft] = useAxios(DART_REDIRECT_URI + `/nfts/${id}`)

    // useEffect(() => {
    //     if (nftResponse.error) {
    //         console.log(nftResponse, '')
    //     }
    // }, [nftResponse])

    return (
        <>
            {nftResponse.loading ? (
                <Skeleton
                    height="40rem"
                    width="40rem"
                    sx={{
                        transform: 'none',
                        maxWidth: isMobile ? '100%' : 480,
                        marginLeft: 'auto',
                    }}
                />
            ) : (
                <Box
                    sx={{
                        display: isMobile ? 'none' : 'block',
                        borderRadius: 0,
                        marginLeft: 'auto',
                        width: '80%',
                    }}
                >
                    <Carousel
                        swipe={true}
                        cycleNavigation
                        interval={4000}
                        autoPlay={true}
                        animation="slide"
                        activeIndicatorIconButtonProps={{
                            style: {
                                backgroundColor: '#00000019',
                            },
                        }}
                    >
                        {mockCarousel.map((node, index) => (
                            <Card
                                sx={{ display: 'flex', borderRadius: '0' }}
                                key={index}
                            >
                                <StyledBox
                                    animationInDelay={1200}
                                    animationIn="fadeIn"
                                    animationOut="fadeOut"
                                    isVisible={true}
                                >
                                    <Typography
                                        size="h2"
                                        weight="SemiBold"
                                        color="#fff"
                                    >
                                        {node.caption}
                                    </Typography>

                                    <CustomButton
                                        size="medium"
                                        href={node.url}
                                        label={t('home.hero.button_3')}
                                    />
                                </StyledBox>
                                <CardMedia
                                    image={node.img}
                                    component="img"
                                    sx={{
                                        pointerEvents: 'none',
                                        height: '80vh',
                                        minHeight: 400,
                                        maxHeight: 600,
                                        maxWidth: '100%',
                                    }}
                                    alt="random"
                                ></CardMedia>
                            </Card>
                        ))}
                    </Carousel>
                </Box>
            )}
        </>
    )
}
