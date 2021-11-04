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
} from '@mui/material';
import { CustomButton } from '../../design-system/atoms/Button';

const StyledStack = styled(Stack)`
    overflow: hidden;
    width: 100vw;
    height: 100%;
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

const ProductPage = () => {
    
    const [{ data: nfts, loading: getLoading, error: getError }, refetch] = useAxios('http://localhost:3000/nfts')
    const nftName = "AD # 8210"
    const artistName = "Aurelia Durand"
    const lorenIpsumShort = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
    const lorenIpsum = "Lorem ipsum dolor sit amet, labore et dolore magna aliqua."

    return (
        <PageWrapper>
            <StyledStack direction='column' spacing={3}>                          
        
                <FlexSpacer minHeight={5} />

                <GridStyled container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
                    {
                        nfts ?
                            nfts.map((nft: any, index: number) => (
                                <GridStyled item xs={2} sm={4} md={4} key={index}>
                                    <PaperStyled>
                                        {nft.name}
                                    </PaperStyled>
                                </GridStyled>
                            ))
                        : 
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
                                    size="h2"
                                    weight="SemiBold"                                   
                                >
                                    {nftName}
                                </Typography>
                                <Typography
                                    size="h4"
                                    weight="SemiBold"
                                    sx={{ pt: 1,  mb: 4 }}
                                >
                                    {artistName}
                                </Typography>
                                {/* Headline */}
                                <Typography
                                    size="h5"
                                    weight="SemiBold"
                                    sx={{ pt: 4}}
                                >
                                    About the artist:
                                </Typography>
                                <Typography
                                    size="h5"
                                    weight="Light"
                                    sx={{ pt: 2,  mb: 1 }}
                                >
                                     {lorenIpsumShort}
                                </Typography>
                             
                                <Typography
                                    size="body"
                                    weight="SemiBold"
                                    sx={{ pt: 4 }}
                                >
                                    Description:  
                                </Typography>
                                <Typography
                                    size="h5"
                                    weight="Light"
                                    sx={{ pt: 2,  mb: 1 }}
                                >
                                     {lorenIpsum}
                                </Typography>
                                <Typography
                                    size="body1"
                                    weight="SemiBold"
                                    sx={{ pt: 4 }}
                                >
                                    Remaining time                                
                                </Typography>
                                <Typography
                                    size="h5"
                                    weight="Light"
                                    sx={{ pt: 2,  mb: 1 }}
                                >
                                     12:12:43:00
                                </Typography>
                                <Stack
                                    sx={{ pt: 4, mt: 2 }}
                                    direction="row"
                                    spacing={2}
                                 >
                                    <CustomButton size="large" label="Primary" sx={{ mx: 2 }}/>
                                      
                                    <CustomButton size="large" label="Secondary"/>
                                   
                                </Stack>
                            </Grid>
                        </Grid>
                    </Container>
                    }
                </GridStyled>
            </StyledStack>
        </PageWrapper>
    )
}

export default ProductPage;