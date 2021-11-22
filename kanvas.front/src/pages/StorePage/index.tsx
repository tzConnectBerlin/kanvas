import useAxios from 'axios-hooks';
import styled from "@emotion/styled";
import ListIcon from '@mui/icons-material/List';
import NftGrid from '../../design-system/organismes/NftGrid';
import FlexSpacer from "../../design-system/atoms/FlexSpacer";
import PageWrapper from "../../design-system/commons/PageWrapper";
import TreeView from '../../design-system/molecules/TreeView/TreeView';
import StoreFilters from '../../design-system/organismes/StoreFilters';

import { useEffect, useState } from 'react';
import { Stack, Theme, Pagination } from "@mui/material";
import { CustomButton } from '../../design-system/atoms/Button';
import { CustomSelect } from '../../design-system/atoms/Select';
import { Typography } from "../../design-system/atoms/Typography";
import { useLocation, useHistory } from 'react-router-dom';
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

    const history = useHistory()
    const search = useLocation().search

    // URL search params to preset filters on loading
    const sort = new URLSearchParams(search).get('sort')
    const page = new URLSearchParams(search).get('page')
    const categories = new URLSearchParams(search).get('categories')

    // Api calls for the categories and the nfts
    const [nftsResponse, getNfts] = useAxios(process.env.REACT_APP_API_SERVER_BASE_URL + '/nfts', { manual: true })
    const [nftsFilteredResponse, getFilteredNfts] = useAxios(process.env.REACT_APP_API_SERVER_BASE_URL + '/nfts/filter', { manual: true })
    const [categoriesResponse, getCategories] = useAxios(process.env.REACT_APP_API_SERVER_BASE_URL + '/categories', { manual: true })

    // is filter open ?
    const [filterOpen, setFilterOpen] = useState(true);

    // Selected Filters and Sorting
    const [selectedFilters, setSelectedFilters] = useState<number[]>([])
    const [selectedPage, setSelectedPage] = useState<number>(1)
    const [selectedSort, setSelectedSort] = useState('')

    // For implementation of futur dynamic filters ?
    const [availableFilters, setAvailableFilters] = useState<any>()

    const handlePaginationChange = (event: any, page: number) => {
        let oldSortPageParams = new URLSearchParams(search).get('sort')
        let oldCategoriesPageParams = new URLSearchParams(search).get('categories')

        history.push({search: `categories=${oldCategoriesPageParams}&sort=${oldSortPageParams}&page=${page}`})

        if (selectedFilters.length === 0) {
            getNfts({
                params: {
                    page: page,
                    pageSize: 12,
                    sort: selectedSort
                }
            })
        } else {
            getFilteredNfts({
                params: {
                    page: page,
                    pageSize: 12,
                    categories: selectedFilters.join(','),
                    sort: selectedSort
                }
            })
        }
    }

    useEffect(() => {
        if (nftsResponse.error) {
            toast.error('An error occured while fetching the store.')
        }
    }, [nftsResponse.error])

    useEffect(() => {
        if (categoriesResponse.data) {
            setAvailableFilters([{
                id: 'root',
                name: 'Categories',
                children: categoriesResponse.data,
            }])
        }
    }, [categoriesResponse.data])

    useEffect(() => {
        debugger
        let params : any = {
            pageSize: 12
        }

        if (page !== null) {
            params['page'] = Number(page)
        }

        if (sort !== null) {
            params['sort'] = Number(sort)
        }

        if (!categories) {
            getNfts({
                params: params
            })
        } else {

            if (categories !== null) {
                params['categories'] = categories.split(',')
            }

            getFilteredNfts({
                params: params
            })
        }
        getCategories()
    },[])

    useEffect(() => {
        // Getting the old filters
        let oldSortPageParams = new URLSearchParams(search).get('sort')
        let oldPagesPageParams = new URLSearchParams(search).get('pages')

        if (selectedFilters.length > 0) {
            // Creating new urlSearcgParams based on the filters update
            let categoriespParam = new URLSearchParams()
            categoriespParam.append('categories', selectedFilters.join(','))

            // Setting properly the search url
            history.push({
                search: `
                    ${categoriespParam? `categories=${oldSortPageParams}` : ''}
                    ${oldSortPageParams ? `categories=${oldSortPageParams}` : ''}
                    ${oldPagesPageParams ? `categories=${oldPagesPageParams}` : ''}`
            })

            getFilteredNfts({
                params: {
                    page: selectedPage,
                    pageSize: 12,
                    categories: selectedFilters.join(','),
                    sort: selectedSort
                }
            })

        } else {
            // Setting properly the search url without the categories
            history.push({
                search: `
                    ${oldSortPageParams ? oldSortPageParams : ''}
                    ${oldPagesPageParams ? oldPagesPageParams : ''}
                    `
            })

            getNfts({
                params: {
                    page: selectedPage,
                    pageSize: 12,
                    categories: selectedFilters.join(','),
                    sort: selectedSort
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
                    {/* TODO: find a better structure to pass the different filters */}
                    <StoreFilters
                        availableFilters={availableFilters}
                        openFilters={filterOpen}
                        filterFunction={getFilteredNfts}
                        selectedFilters={selectedFilters}
                        setSelectedFilters={setSelectedFilters}
                        loading={categoriesResponse.loading}
                    />

                    <NftGrid open={filterOpen} nfts={selectedFilters.length === 0 ? nftsResponse.data?.nfts : nftsFilteredResponse.data?.nfts} loading={nftsResponse.loading || nftsFilteredResponse.loading}/>
                </Stack>

                <Stack direction="row">
                    <FlexSpacer/>
                    <StyledPagination defaultPage={page ? Number(page) : 1} count={selectedFilters.length === 0 ? nftsResponse.data?.numberOfPages : nftsFilteredResponse.data?.numberOfPages} onChange={handlePaginationChange} variant="outlined" shape="rounded" disabled={nftsResponse.loading || nftsFilteredResponse.loading}/>
                </Stack>

                <FlexSpacer minHeight={5} />
            </StyledStack>
        </PageWrapper>
    )
}

export default StorePage;