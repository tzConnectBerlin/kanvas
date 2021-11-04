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
    const productName = "TzPunks # 8210"

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
                            <Grid item container sm={12} md={7} spacing={3}>
                                <Grid item xs={12} md={11}>
                                    <Card
                                        sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            position: 'relative',
                                        }}
                                    >
                                        <CardMedia
                                            component="img"
                                            image="https://i.picsum.photos/id/866/200/300.jpg?hmac=rcadCENKh4rD6MAp6V_ma-AyWv641M4iiOpe1RyFHeI"
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
                                <Typography
                                    size="h1"
                                    weight="Bold"
                                    sx={{ pt: 4, mt: 6 }}
                                >
                                    {productName}
                                </Typography>
                                <Typography
                                    size="h5"
                                    weight="Light"
                                    sx={{ pt: 4, mt: 6 }}
                                >
                                    About the artist
                                </Typography>
                                <Typography
                                    size="body"
                                    weight="Light"
                                    sx={{ pt: 4, mt: 6 }}
                                >
                                    Artist: Lorem Ypsum
                                </Typography>
                                <Typography
                                    size="body"
                                    weight="Light"
                                    sx={{ pt: 4, mt: 6 }}
                                >
                                    Artist: Lorem Ypsum
                                </Typography>
                                <Typography
                                    size="body1"
                                    weight="Light"
                                    sx={{ pt: 4, mt: 6 }}
                                >
                                    Time left
                                </Typography>
        
                                <Stack
                                    sx={{ pt: 4, mt: 6 }}
                                    direction="row"
                                    spacing={2}
                                >
                                    <CustomButton size="large" label="Primary action" primary />
                                      
                                     <CustomButton size="large" label="Secondary action" backgroundColor="" primary={false}/>
                                   
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