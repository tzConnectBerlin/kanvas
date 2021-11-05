import styled from "@emotion/styled";
import PageWrapper from "../../design-system/commons/PageWrapper";
import { GET_NFTS } from '../../api/queries/nfts';
import { Typography } from "../../design-system/atoms/Typography";
import FlexSpacer from "../../design-system/atoms/FlexSpacer";
import useAxios from 'axios-hooks';
import {
    Paper,
    Card,
    CardMedia,
    Container,
    Grid,
    Stack,
    useMediaQuery,
    Theme,
    useTheme
} from '@mui/material';
import { CustomButton } from '../../design-system/atoms/Button';
import { useTranslation } from 'react-i18next';
import { FC } from "react";

const StyledStack = styled(Stack)`
    overflow: hidden;
    width: 100vw;
    height: 100%;
    align-items: center;
`

const GridStyled = styled(Grid)`
    width: 100%;
`

const PaperStyled = styled(Paper)`
    height: 20rem;
    display: flex;
    justify-content: center;
    align-items: center;
`

export interface ProductPageProps {
    id?: string;
    theme?: Theme;
    loading?: boolean;
    responsive?: boolean;
}



export const ProductPage : FC<ProductPageProps> = ({loading=false, responsive=false, id, ...props}) => {
    const { t } = useTranslation(['translation']);

    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    // const isMobile = useMediaQuery(' (max-width:382px)');

    const [{ data: nfts, loading: getLoading, error: getError }, refetch] = useAxios('http://localhost:3000/nfts')



    const data = {
        nftName: 'AD # 8210',
        artistName: 'Aurélia Durand',
        time: '12:12:43:00'
    }

    return (
        <PageWrapper>
            <StyledStack direction='column' spacing={3}>
                <FlexSpacer minHeight={5} />
                    <Container
                        sx={{ py: 8, overflow: 'hidden' }}
                        maxWidth="lg"

                    >
                        <Grid container spacing={2}>
                            <Grid container sm={12} md={7} >
                                <Grid xs={12} md={11}>
                                    <Card
                                        sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            position: 'relative',
                                        }}
                                    >
                                        <CardMedia
                                            component="img"
                                            height="600"
                                            image="https://uploads-ssl.webflow.com/60098420fcf354eb258f25c5/60098420fcf3542cf38f287b_Illustrations%202019-37.jpg"
                                            alt="random"
                                        />
                                    </Card>
                                </Grid>
                            </Grid>

                            <Grid
                                item
                                container
                                md={5}
                                spacing={2}
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                }}
                            >

                                {/* Headline */}

                                <Typography

                                    size="h4"
                                    weight="SemiBold"
                                    sx={{marginTop: isMobile?'5rem':undefined, pt: 1,  mb: 1}}
                                >
                                    {data.artistName}
                                </Typography>

                                <Typography
                                    size="h2"
                                    weight="SemiBold"
                                    >
                                    {data.nftName}
                                </Typography>


                                {/* Headline */}
                                <Typography
                                    size="h5"
                                    weight="SemiBold"
                                    sx={{ pt: 4}}
                                >
                                   {t('product.description.part_1')}
                                </Typography>
                                <Typography
                                    size="h5"
                                    weight="Light"
                                    sx={{ pt: 2,  mb: 1 }}
                                >
                                     {t('common.lorenIpsumShort')}
                                </Typography>

                                <Typography
                                    size="body"
                                    weight="SemiBold"
                                    sx={{ pt: 4 }}
                                >

                                   {t('product.description.part_2')}

                                </Typography>
                                <Typography
                                    size="h5"
                                    weight="Light"
                                    sx={{ pt: 2,  mb: 1 }}
                                >
                                    {t('common.lorenIpsum')}
                                </Typography>
                                <Typography
                                    size="body1"
                                    weight="SemiBold"
                                    sx={{ pt: 4 }}
                                >
                                   {t('product.description.part_3')}
                                </Typography>
                                <Typography
                                    size="h5"
                                    weight="Light"
                                    sx={{ pt: 2,  mb: 1 }}
                                >
                                     {data.time}
                                </Typography>
                                <Stack
                                    sx={{ pt: 4, mt: 2 }}
                                    direction="row"
                                    spacing={2}

                                 >
                                    <CustomButton size="large" label={t('product.button_1')}  sx={{width: isMobile? '100%' :undefined, mx: 2}} />
                                </Stack>
                            </Grid>
                        </Grid>
                    </Container>
            </StyledStack>
        </PageWrapper>
    )
}

export default ProductPage;