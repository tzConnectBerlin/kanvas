import useAxios from 'axios-hooks';
import styled from "@emotion/styled";
import ListIcon from '@mui/icons-material/List';
import NftGrid from '../../design-system/organismes/NftGrid';
import FlexSpacer from "../../design-system/atoms/FlexSpacer";
import PageWrapper from "../../design-system/commons/PageWrapper";
import IconExpansionTreeView from '../../design-system/molecules/TreeView/TreeView';
import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined';

import { useEffect, useState } from 'react';
import { Stack, Theme, Pagination } from "@mui/material";
import { CustomButton } from '../../design-system/atoms/Button';
import { CustomSelect } from '../../design-system/atoms/Select';
import { Typography } from "../../design-system/atoms/Typography";
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

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

const StyledKeyboardArrowDownOutlinedIcon = styled(KeyboardArrowDownOutlinedIcon)<{theme?: Theme}>`
    color: ${props => props.theme.palette.text.primary};
    margin-left: -0.5rem;
    padding-right: 0.5rem;
`

const StyledPagination = styled(Pagination)<{theme?: Theme}>`
    margin-right: 1.4rem;

    .MuiPaginationItem-root  {
        border-radius: 0;

        font-family: 'Poppins' !important;
    }

    .MuiPaginationItem-root.Mui-selected {
        background-color: ${props => props.theme.palette.background.default} !important;
        border: 1px solid ${props => props.theme.palette.text.primary} !important;
    }

    nav {
        display: flex;
        align-items: center !important;
    }
`

const StorePage = () => {

    const search = useLocation().search

    const categories = new URLSearchParams(search).get('categories')
    const sort = new URLSearchParams(search).get('sort')
    const page = new URLSearchParams(search).get('page')

    // Api calls for the categories and the nfts
    const [nftsResponse, getNfts] = useAxios(process.env.REACT_APP_API_SERVER_BASE_URL + '/nfts', { manual: true })
    const [nftsFilteredResponse, getFilteredNfts] = useAxios(process.env.REACT_APP_API_SERVER_BASE_URL + '/nfts/filter', { manual: true })
    // const [categoriesResponse, getCategories] = useAxios(process.env.REACT_APP_API_SERVER_BASE_URL + '/categories', { manual: true })

    // is filter open ?
    const [filterOpen, setFilterOpen] = useState(false);

    const [selectedFilters, setSelectedFilters] = useState<any[]>([])
    const [selectedSort, setSelectedSort] = useState('')

    const handlePaginationChange = () => {
        // Call endpoint with correcponding variables
    }

    useEffect(() => {
        // check on the search for the used params
        console.log(categories)
        console.log(sort)
        console.log(page)
    }, [nftsResponse.data])

    useEffect(() => {
        if (nftsResponse.error) {
            toast.error('An error occured while fetching the store.')
        }
    }, [nftsResponse.error])

    useEffect(() => {
        // fetch initial data
        getNfts({
            params: {
                categories: selectedFilters.join(';')
            }
        })
        // getCategories()
    },[])

    useEffect(() => {
        if (selectedFilters.length > 0) {
            getFilteredNfts({
                params: {
                    categories: selectedFilters.join(';')
                }
            })
        }
    }, [selectedFilters])

    return (
        <PageWrapper>
            <StyledStack direction='column' spacing={3}>

                <FlexSpacer minHeight={10} />

                <Typography size="h1" weight='SemiBold' sx={{justifyContent: 'center'}}> Store front</Typography>

                <FlexSpacer minHeight={1} />

                {/* Toggle options */}
                <Stack direction="row">
                    <CustomButton size="medium" onClick={() => setFilterOpen(!filterOpen)} aria-label="loading" icon={<StyledListIcon />} label={`Filters ${selectedFilters.length > 0 ? `  - ${selectedFilters.length}` : ''}`} sx={{marginLeft: '1.5rem !important'}} disabled={nftsResponse.loading} />
                    <FlexSpacer/>
                    <CustomSelect id='Sort filter - store page' selectedOption={selectedSort} setSelectedOption={setSelectedSort} disabled={nftsResponse.loading}/>
                </Stack>

                <Stack direction="row">
                    <IconExpansionTreeView open={filterOpen} filterFunction={getFilteredNfts} selectedFilters={selectedFilters} setSelectedFilters={setSelectedFilters}/>

                    <NftGrid open={filterOpen} nfts={selectedFilters.length === 0 ? nftsResponse.data?.data : nftsFilteredResponse.data?.data} loading={nftsResponse.loading || nftsFilteredResponse.loading}/>
                </Stack>

                <Stack direction="row">
                    <FlexSpacer/>
                    <StyledPagination count={10} onChange={handlePaginationChange} variant="outlined" shape="rounded" disabled={nftsResponse.loading || nftsFilteredResponse.loading}/>
                </Stack>

                <FlexSpacer minHeight={5} />
            </StyledStack>
        </PageWrapper>
    )
}

export default StorePage;