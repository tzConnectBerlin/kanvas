import { FC, useEffect, useState } from "react";
import { ButtonBase, Card, CardActionArea, CardActions, CardMedia, Grid, Skeleton, Stack, Theme, useMediaQuery, useTheme } from '@mui/material';
import FlexSpacer from "../../../design-system/atoms/FlexSpacer";
import Slider from "../../../design-system/organismes/Slider";
import { CustomButton } from '../../atoms/Button';
import { Typography } from "../../../design-system/atoms/Typography";
import { useTranslation } from 'react-i18next';
import { useParams, useHistory } from 'react-router-dom';
import useAxios from 'axios-hooks';
import { DART_REDIRECT_URI } from "../../../global";

export interface HeroProps {
    loading?: boolean;
    selectedTheme?: string;
    theme?: Theme;
}
interface IProductParam {
    id: string;
}

export const Hero: FC<HeroProps> = ({ ...props }) => {
    const { t } = useTranslation(['translation']);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const history = useHistory()
    const navigateTo = (componentURL: string) => {
        debugger
        history.push(`/${componentURL}`)
    }

    const [imgToVideoToggler, setImgToVideoToggler] = useState(true);

    const { id } = useParams<IProductParam>()
    const [nftResponse, getNft] = useAxios(DART_REDIRECT_URI + `/nfts/${id}`)

    useEffect(() => {
        if (nftResponse.error) {
            console.log(nftResponse, 'debugger')
        }
    }, [nftResponse])

    return (
        <Grid container>

            {/* HERO: Greetings and button set */}
            <Grid item xs={12} md={5} pr={isMobile ? 0 : 5}>
                <FlexSpacer minHeight={4} />

                <Typography
                    size="h1"
                    weight="SemiBold"
                    sx={{ pt: 4 }}
                >
                    {t('home.hero.headline')}
                </Typography>

                <Typography
                    size="h3"
                    weight="Light"
                    sx={{ pt: 2, mb: 1 }}
                >
                    {t('home.hero.description_1')}
                </Typography>

                <Typography
                    size="h5"
                    weight="Light"
                    sx={{ pt: 2, mb: 1 }}
                >
                    {t('home.hero.description_2')}
                </Typography>

                <FlexSpacer minHeight={3} />

                <Stack direction="row">
                    <CustomButton size="medium" label={t('home.hero.button_1')} onClick={() => navigateTo('store')} />
                </Stack>
            </Grid>

            {/* HERO: Featured Image */}
            <Grid item xs={12} md={7} px={0} sx={{ display: 'flex' }}>

                { //Render Skeleton if image not loading
                    nftResponse.loading ?
                        <Skeleton height='40rem' width='40rem' sx={{ transform: 'none', maxWidth: isMobile ? '100%' : 480, marginLeft: 'auto' }} />

                        // Render Slider
                        : imgToVideoToggler ? (<Slider />)

                            //Render Single image
                            : (
                                <Card sx={{ borderRadius: 0, marginLeft: 'auto', maxWidth: 750 }}>
                                    <CardActionArea>
                                        <ButtonBase onClick={() => navigateTo('sign-in')}>
                                            <CardMedia
                                                component="img"
                                                image="https://uploads-ssl.webflow.com/60098420fcf354eb258f25c5/60098420fcf3542cf38f287b_Illustrations%202019-37.jpg"
                                                alt="random"
                                                sx={{
                                                    height: '70vh',
                                                    minHeight: 300,
                                                    maxHeight: 600,
                                                    maxWidth: 750,
                                                    display: isMobile ? 'none' : 'flex',
                                                }}
                                            />
                                        </ButtonBase>
                                    </CardActionArea>
                                </Card>
                            )
                }
            </Grid>
        </Grid >
    )
}