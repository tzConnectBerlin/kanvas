import useAxios from 'axios-hooks';
import styled from "@emotion/styled";
import ListIcon from '@mui/icons-material/List';
import NftGrid from '../../design-system/organismes/NftGrid';
import FlexSpacer from "../../design-system/atoms/FlexSpacer";
import PageWrapper from "../../design-system/commons/PageWrapper";
import IconExpansionTreeView from '../../design-system/molecules/TreeView/TreeView';

import { useEffect, useState } from 'react';
import { Grid, Stack, Paper, Theme } from "@mui/material";
import { CustomButton } from '../../design-system/atoms/Button';
import { Typography } from "../../design-system/atoms/Typography";

const StyledStack = styled(Stack)`
    overflow: hidden;
    max-width: 100rem;
    width: 100%;
    height: 100%;
`

const StyledListIcon = styled(ListIcon)<{theme?: Theme}>`
    color: ${props => props.theme.palette.text.primary};
    padding-right: 1rem;
`

const StorePage = () => {

    const [nftsResponse, getNfts] = useAxios('http://localhost:3000/nfts', { manual: true })

    const [filterOpen, setFilterOpen] = useState(false);

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(true);

    useEffect(() => {
        getNfts()
    },[])

    return (
        <PageWrapper>
            <StyledStack direction='column' spacing={3}>

                <FlexSpacer minHeight={10} />

                <Typography size="h1" weight='SemiBold' sx={{justifyContent: 'center'}}> Store front</Typography>

                <FlexSpacer minHeight={1} />

                {/* Toggle options */}
                <Stack direction="row">
                    <CustomButton size="medium" onClick={() => setFilterOpen(!filterOpen)} aria-label="loading" icon={<StyledListIcon />} label='Filters' sx={{marginLeft: '1.5rem !important'}} />
                    <FlexSpacer/>
                    <CustomButton size="medium" onClick={() => setData(!data)} aria-label="data" label={'Sort'} sx={{marginRight: '1.5rem !important'}} />
                </Stack>

                <Stack direction="row">
                    <IconExpansionTreeView open={filterOpen} filterFunction={() => {}} />

                    <NftGrid open={filterOpen} nfts={nftsResponse.data} loading={nftsResponse.loading}/>
                </Stack>

                <FlexSpacer minHeight={5} />
            </StyledStack>
        </PageWrapper>
    )
}

export default StorePage;