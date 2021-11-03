import styled from "@emotion/styled";
import PageWrapper from "../../design-system/commons/PageWrapper";
import { GET_NFTS } from '../../api/queries/nfts';

import { Grid, Stack, Paper } from "@mui/material";
import { Typography } from "../../design-system/atoms/Typography";
import FlexSpacer from "../../design-system/atoms/FlexSpacer";
import useAxios from 'axios-hooks';

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

const StorePage = () => {
    
    const [{ data: nfts, loading: getLoading, error: getError }, refetch] = useAxios('http://localhost:3000/nfts')

    return (
        <PageWrapper>
            <StyledStack direction='column' spacing={3}>
                
                <FlexSpacer minHeight={12} />

                <Typography size="h1" weight='Bold'> Store front</Typography>
            
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
                            <Typography size="h3" weight='Medium'> Nothing to display...</Typography>
                    }
                </GridStyled>
            </StyledStack>
        </PageWrapper>
    )
}

export default StorePage;