import useAxios from 'axios-hooks'
import styled from '@emotion/styled'
import ListIcon from '@mui/icons-material/List'
import NftGrid from '../../design-system/organismes/NftGrid'
import FlexSpacer from '../../design-system/atoms/FlexSpacer'
import PageWrapper from '../../design-system/commons/PageWrapper'
import StoreFilters from '../../design-system/organismes/StoreFilters'

import { useEffect, useState } from 'react'
import { Stack, Theme, Pagination, Container } from '@mui/material'
import { CustomButton } from '../../design-system/atoms/Button'
import { CustomSelect } from '../../design-system/atoms/Select'
import { Typography } from '../../design-system/atoms/Typography'
import { useLocation, useHistory, useParams } from 'react-router'
import { toast } from 'react-toastify'
// import mockNft from '../../_mocks/mockNft'

interface ParamTypes {
    width?: any
}

const StyledStack = styled(Stack)`
    max-width: 100rem;
    width: 100vw;
    height: 100%;

    @media (max-width: 650px) {
        padding: 0 2rem 1rem;
    }
`
const StyledContentStack = styled(Stack)<ParamTypes>`
    flex-direction: row;
    width: 100%;

    @media (max-width: 900px) {
        flex-direction: column;
    }
`
const StyledListIcon = styled(ListIcon)<{ theme?: Theme }>`
    color: ${(props) => props.theme.palette.text.primary};
    padding-right: 1rem;
`

const StyledPagination = styled(Pagination)<{ theme?: Theme }>`
    .MuiPaginationItem-root {
        border-radius: 0;

        font-family: 'Poppins' !important;
    }

    .MuiPaginationItem-root.Mui-selected {
        background-color: ${(props) =>
            props.theme.palette.background.default} !important;
        border: 1px solid ${(props) => props.theme.palette.text.primary} !important;
    }

    nav {
        display: flex;
        align-items: center !important;
    }
`

const StorePage = () => {
    const search = useLocation().search
    const history = useHistory()

    const categories = new URLSearchParams(search).get('categories')
    const sort = new URLSearchParams(search).get('sort')
    const page = new URLSearchParams(search).get('page')

    const [selectedPage, setSelectedPage] = useState(page ? Number(page) : 1)
    const [priceFilterRange, setPriceFilterRange] = useState<[number, number]>([0,100])

    // Api calls for the categories and the nfts
    const [nftsResponse, getNfts] = useAxios(
        process.env.REACT_APP_API_SERVER_BASE_URL + '/nfts',
        { manual: true },
    )
    const [nftsFilteredResponse, getFilteredNfts] = useAxios(
        process.env.REACT_APP_API_SERVER_BASE_URL + '/nfts/filter',
        { manual: true },
    )
    const [categoriesResponse, getCategories] = useAxios(
        process.env.REACT_APP_API_SERVER_BASE_URL + '/categories',
        { manual: true },
    )

    // is filter open ?
    const [filterOpen, setFilterOpen] = useState(true)

    const [selectedFilters, setSelectedFilters] = useState<any[]>([])
    const [selectedSort, setSelectedSort] = useState('')

    const [availableFilters, setAvailableFilters] = useState<any>()

    const handlePaginationChange = (event: any, page: number) => {
        const pageParam = new URLSearchParams(search)
        setSelectedPage(page)

        if (pageParam.get('page')) {
            pageParam.set('page', page.toString())
        } else {
            pageParam.append('page', page.toString())
        }

        history.push({ search: pageParam.toString() })

        if (selectedFilters.length === 0) {
            getNfts({
                params: {
                    page: page,
                    pageSize: 12,
                    categories: selectedFilters.join(','),
                    sort: selectedSort,
                },
            })
        } else {
            getFilteredNfts({
                params: {
                    page: page,
                    pageSize: 12,
                    categories: selectedFilters.join(','),
                    sort: selectedSort,
                },
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
            setAvailableFilters([
                {
                    id: 'root',
                    name: 'Categories',
                    children: categoriesResponse.data,
                },
            ])
        }
    }, [categoriesResponse.data])

    useEffect(() => {
        getCategories()
        let pageParam = new URLSearchParams(search)

        if (!page) {
            setSelectedPage(1)
            pageParam.delete('page')
        } else {
            setSelectedPage(Number(page))
        }

        if (categories) {
            setSelectedFilters(
                categories.split(',').map((categoryId) => Number(categoryId)),
            )
        } else {
            history.push({ search: pageParam.toString() })
        }
    }, [])

    useEffect(() => {
        if (selectedFilters.length > 0) {
            let pageParam = new URLSearchParams(search)

            // Deleting page param when changing the filters and setting selected page to one

            if (pageParam.get('categories')) {
                pageParam.set('categories', selectedFilters.join(','))
            } else {
                pageParam.append('categories', selectedFilters.join(','))
            }

            history.push({ search: pageParam.toString() })

            getFilteredNfts({
                params: {
                    page: 1,
                    pageSize: 12,
                    categories: selectedFilters.join(','),
                    sort: selectedSort,
                },
            })
        } else {
            let pageParam = new URLSearchParams(search)
            pageParam.delete('categories')
            let pageReset = 0

            history.push({ search: pageParam.toString() })
            getNfts({
                params: {
                    pageSize: 12,
                    page: pageReset !== 0 ? pageReset : selectedPage,
                    sort: sort,
                },
            })
        }
    }, [selectedFilters])

    return (
        <PageWrapper>
            <StyledStack direction="column" spacing={3}>
                <FlexSpacer minHeight={10} />

                <Typography
                    size="h1"
                    weight="SemiBold"
                    sx={{ justifyContent: 'center' }}
                >
                    {' '}
                    Store front
                </Typography>

                <FlexSpacer minHeight={1} />

                {/* Toggle options */}
                <Stack direction="row">
                    <CustomButton
                        size="medium"
                        onClick={() => setFilterOpen(!filterOpen)}
                        aria-label="loading"
                        icon={<StyledListIcon />}
                        label={`Filters ${
                            selectedFilters.length > 0
                                ? `  - ${selectedFilters.length}`
                                : ''
                        }`}
                        disabled={nftsResponse.loading}
                    />

                    <FlexSpacer />

                    <CustomSelect
                        id="Sort filter - store page"
                        selectedOption={selectedSort}
                        setSelectedOption={setSelectedSort}
                        disabled={nftsResponse.loading}
                    />
                </Stack>

                <StyledContentStack>
                    <StoreFilters
                        availableFilters={availableFilters}
                        openFilters={filterOpen}
                        filterFunction={getFilteredNfts}
                        selectedFilters={selectedFilters}
                        setSelectedFilters={setSelectedFilters}
                        priceFilterRange={priceFilterRange}
                        setPriceFilterRange={setPriceFilterRange}
                        loading={categoriesResponse.loading}
                    />

                    <NftGrid
                        open={filterOpen}
                        nfts={
                            selectedFilters.length === 0
                                ? nftsResponse.data?.nfts
                                : nftsFilteredResponse.data?.nfts
                        }
                        loading={
                            nftsResponse.loading || nftsFilteredResponse.loading
                        }
                    />
                </StyledContentStack>

                <Stack direction="row">
                    <FlexSpacer />
                    <StyledPagination
                        page={selectedPage}
                        count={
                            selectedFilters.length === 0
                                ? nftsResponse.data?.numberOfPages
                                : nftsFilteredResponse.data?.numberOfPages
                        }
                        onChange={handlePaginationChange}
                        variant="outlined"
                        shape="rounded"
                        disabled={
                            nftsResponse.loading || nftsFilteredResponse.loading
                        }
                    />
                </Stack>

                <FlexSpacer minHeight={5} />
            </StyledStack>
        </PageWrapper>
    )
}

export default StorePage
