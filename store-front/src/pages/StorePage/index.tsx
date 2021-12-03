import useAxios from 'axios-hooks';
import styled from '@emotion/styled';
import ListIcon from '@mui/icons-material/List';
import NftGrid from '../../design-system/organismes/NftGrid';
import FlexSpacer from '../../design-system/atoms/FlexSpacer';
import PageWrapper from '../../design-system/commons/PageWrapper';
import StoreFilters from '../../design-system/organismes/StoreFilters';

import { useEffect, useState } from 'react';
import { Stack, Theme, Pagination } from '@mui/material';
import { CustomButton } from '../../design-system/atoms/Button';
import { CustomSelect } from '../../design-system/atoms/Select';
import { Typography } from '../../design-system/atoms/Typography';
import { useHistory } from 'react-router';

interface ParamTypes {
    width?: any;
}

const StyledStack = styled(Stack)`
    max-width: 100rem;
    width: 100vw;
    height: 100%;

    @media (max-width: 650px) {
        padding: 0 1.5rem 1rem;
    }
`;
const StyledContentStack = styled(Stack) <ParamTypes>`
    flex-direction: row;
    width: 100%;

    @media (max-width: 900px) {
        flex-direction: column;
    }
`;
const StyledListIcon = styled(ListIcon) <{ theme?: Theme }>`
    color: ${(props) => props.theme.palette.text.primary};
    padding-right: 1rem;
`;

const StyledPagination = styled(Pagination) <{
    theme?: Theme;
    display: boolean;
}>`
    display: ${(props) => (props.display ? 'flex' : 'none')};

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
`;

const StorePage = () => {
    const history = useHistory();

    // Pagination state
    const [selectedPage, setSelectedPage] = useState<number>(1);

    // Sort state
    const [selectedSort, setSelectedSort] = useState<{
        orderBy: 'price' | 'name' | 'createdAt';
        orderDirection: 'asc' | 'desc';
    }>();

    // Categories state
    const [selectedCategories, setSelectedCategories] = useState<any[]>([]);

    // Availability state
    const [selectedAvailability, setSelectedAvailability] = useState<string[]>(
        [],
    );

    // Price states
    const [priceFilterRange, setPriceFilterRange] =
        useState<[number, number]>();

    // Conditionnal states
    const [filterOpen, setFilterOpen] = useState<boolean>(true);
    const [filterSliding, setFilterSliding] = useState<boolean>(false);
    const [comfortLoader, setComfortLoader] = useState<boolean>(false);

    // Api calls for the categories and the nfts
    const [nftsResponse, getNfts] = useAxios(
        process.env.REACT_APP_API_SERVER_BASE_URL + '/nfts',
        { manual: true },
    );
    const [categoriesResponse, getCategories] = useAxios(
        process.env.REACT_APP_API_SERVER_BASE_URL + '/categories',
        { manual: true },
    );

    useEffect(() => {
        getCategories();
        getPageParams();
    }, []);

    const callNFTsEndpoint = (
        handlePriceRange: boolean,
        page?: number,
        categories?: number[],
        orderBy?: string,
        orderDirection?: string,
        priceAtLeast?: number,
        priceAtMost?: number,
        availability?: string[],
    ) => {
        setComfortLoader(true);
        const comfortTrigger = setTimeout(() => {
            getNfts({
                withCredentials: true,
                params: {
                    page: page ?? 1,
                    pageSize: 12,
                    categories: categories ?? selectedCategories.join(',') ?? undefined,
                    orderBy: orderBy ?? selectedSort?.orderBy ?? 'createdAt',
                    orderDirection: orderDirection ?? selectedSort?.orderDirection ?? 'desc',
                    priceAtLeast: priceAtLeast ?? (
                        handlePriceRange && priceFilterRange
                            ? priceFilterRange[0]
                            : undefined),
                    priceAtMost: priceAtMost ?? (
                        handlePriceRange && priceFilterRange
                            ? priceFilterRange[1]
                            : undefined),
                    availability: availability ?? (
                        selectedAvailability.length === 0
                            ? 'onSale,soldOut,upcoming'
                            : selectedAvailability.join(',')),
                },
            });
            setComfortLoader(false);
        }, 300);

        return () => {
            clearTimeout(comfortTrigger);
        };
    };

    const getPageParams = () => {
        let pageParam = new URLSearchParams(history.location.search);

        const page = pageParam.get('page');
        const categories = pageParam.get('categories');
        const priceAtLeast = pageParam.get('priceAtLeast');
        const priceAtMost = pageParam.get('priceAtMost');
        const orderBy = pageParam.get('orderBy') as
            | 'createdAt'
            | 'price'
            | 'name';
        const orderDirection = pageParam.get('orderDirection') as
            | 'asc'
            | 'desc';
        const availability = pageParam.get('availability');

        // Pagination
        if (page) {
            setSelectedPage(Number(page));
        }

        // Prices
        if (priceAtLeast && priceAtMost) {
            setPriceFilterRange([Number(priceAtLeast), Number(priceAtMost)]);
        } else {
            setPriceFilterRange(undefined);
        }

        // Order
        if (orderBy && orderDirection) {
            setSelectedSort({
                orderBy: orderBy,
                orderDirection: orderDirection,
            });
        }

        // Availability
        if (availability) {
            setSelectedAvailability(availability.split(','));
        }

        // Categories
        if (categories) {
            setSelectedCategories(
                categories.split(',').map((categoryId) => Number(categoryId)),
            );
        }

        callNFTsEndpoint(
            true,
            page ? Number(page) : 1,
            categories?.split(',').map((categoryId) => Number(categoryId)),
            orderBy,
            orderDirection,
            priceAtLeast ? Number(priceAtLeast) : undefined,
            priceAtMost ? Number(priceAtMost) : undefined,
            availability?.split(',')
        );
    };

    const setPageParams = (
        queryParam:
            | 'categories'
            | 'page'
            | 'availability'
            | 'priceAtLeast'
            | 'priceAtMost'
            | 'orderBy'
            | 'orderDirection',
        queryParamValue: string,
    ) => {
        const actualPageParam = new URLSearchParams(history.location.search);

        if (actualPageParam.get(queryParam)) {
            actualPageParam.set(queryParam, queryParamValue);
        } else {
            actualPageParam.append(queryParam, queryParamValue);
        }

        history.push({ search: actualPageParam.toString() });
    };

    const deletePageParams = (
        queryParam:
            | 'categories'
            | 'page'
            | 'availability'
            | 'priceAtLeast'
            | 'priceAtMost'
            | 'orderBy'
            | 'orderDirection',
    ) => {
        const actualPageParam = new URLSearchParams(history.location.search);

        if (actualPageParam.get(queryParam)) {
            actualPageParam.delete(queryParam);
        }

        history.push({ search: actualPageParam.toString() });
    };

    const handlePaginationChange = (event: any, page: number) => {
        setSelectedPage(page);
        setPageParams('page', page.toString());
        callNFTsEndpoint(true);
    };

    const triggerPriceFilter = () => {
        if (priceFilterRange) {
            setPageParams('priceAtLeast', priceFilterRange[0].toString());
            setPageParams('priceAtMost', priceFilterRange[1].toString());
        }
        callNFTsEndpoint(true);
    };

    useEffect(() => {
        if (selectedSort) {
            setPageParams('orderBy', selectedSort.orderBy);
            setPageParams('orderDirection', selectedSort.orderDirection);
        } else {
            deletePageParams('orderBy');
            deletePageParams('orderDirection');
        }
    }, [selectedSort]);

    useEffect(() => {
        if (selectedCategories.length)
            setPageParams('categories', selectedCategories.join(','));
        else deletePageParams('categories');
    }, [selectedCategories]);

    useEffect(() => {
        if (selectedAvailability.length)
            setPageParams('availability', selectedAvailability.join(','));
        else deletePageParams('availability');
    }, [selectedAvailability]);

    const [availableFilters, setAvailableFilters] = useState<any>();

    useEffect(() => {
        if (categoriesResponse.data) {
            setAvailableFilters([
                {
                    id: 'root',
                    name: 'Categories',
                    children: categoriesResponse.data,
                },
            ]);
        }
    }, [categoriesResponse.data]);

    return (
        <PageWrapper>
            <StyledStack direction="column" spacing={3}>
                <FlexSpacer minHeight={10} />

                <Typography
                    size="h1"
                    weight="SemiBold"
                    sx={{ justifyContent: 'center' }}
                >
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
                        label={`Filters ${selectedCategories.length > 0
                            ? `  - ${selectedCategories.length}`
                            : ''
                            }`}
                        disabled={nftsResponse.loading}
                    />

                    <FlexSpacer />

                    <CustomSelect
                        id="Sort filter - store page"
                        selectedOption={selectedSort}
                        setSelectedOption={setSelectedSort}
                        callNFTsEndpoint={callNFTsEndpoint}
                        disabled={nftsResponse.loading}
                    />
                </Stack>

                <StyledContentStack>
                    <StoreFilters
                        availableFilters={availableFilters}
                        openFilters={filterOpen}
                        callNFTsEndpoint={callNFTsEndpoint}
                        selectedFilters={selectedCategories}
                        setSelectedFilters={setSelectedCategories}
                        priceFilterRange={priceFilterRange}
                        setPriceFilterRange={setPriceFilterRange}
                        loading={categoriesResponse.loading}
                        minRange={nftsResponse.data?.lowerPriceBound ?? 0}
                        maxRange={nftsResponse.data?.upperPriceBound ?? 100}
                        triggerPriceFilter={triggerPriceFilter}
                        setFilterSliding={setFilterSliding}
                        availabilityFilter={selectedAvailability}
                        setAvailabilityFilter={setSelectedAvailability}
                    />

                    <NftGrid
                        open={filterOpen}
                        nfts={nftsResponse.data?.nfts}
                        loading={
                            nftsResponse.loading ||
                            filterSliding ||
                            comfortLoader
                        }
                    />
                </StyledContentStack>

                <Stack direction="row">
                    <FlexSpacer />
                    <StyledPagination
                        display={nftsResponse.data?.numberOfPages > 1}
                        page={selectedPage}
                        count={nftsResponse.data?.numberOfPages}
                        onChange={handlePaginationChange}
                        variant="outlined"
                        shape="rounded"
                        disabled={
                            nftsResponse.loading ||
                            filterSliding ||
                            comfortLoader
                        }
                    />
                </Stack>

                <FlexSpacer minHeight={5} />
            </StyledStack>
        </PageWrapper>
    );
};

export default StorePage;
