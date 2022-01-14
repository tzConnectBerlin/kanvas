import useAxios from 'axios-hooks';
import styled from '@emotion/styled';
import ListIcon from '@mui/icons-material/List';
import NftGrid from '../../design-system/organismes/NftGrid';
import FlexSpacer from '../../design-system/atoms/FlexSpacer';
import PageWrapper from '../../design-system/commons/PageWrapper';
import StoreFilters from '../../design-system/organismes/StoreFilters';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

import { useEffect, useState } from 'react';
import {
    Stack,
    Theme,
    Pagination,
    useMediaQuery,
    useTheme,
    Chip,
    SelectChangeEvent,
} from '@mui/material';

import { CustomSelect } from '../../design-system/atoms/Select';
import { Typography } from '../../design-system/atoms/Typography';
import { useHistory } from 'react-router';

interface ParamTypes {
    width?: any;
}

interface SortProps {
    orderBy: 'price' | 'name' | 'createdAt';
    orderDirection: 'asc' | 'desc';
}

const StyledStack = styled(Stack)`
    max-width: 100rem;
    width: 100%;
    height: 100%;
`;

const StyledContentStack = styled(Stack)<ParamTypes>`
    flex-direction: row;
    width: 100%;
    margin-top: 2.5rem !important;

    @media (max-width: 900px) {
        flex-direction: column;
    }
`;

const StyledPagination = styled(Pagination)<{
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

const StyledChevronLeftIcon = styled(ChevronLeftIcon)<{
    opened: boolean;
    theme?: Theme;
}>`
    height: 1.8rem;
    width: 1.8rem;
    color: ${(props) => props.theme.palette.text.primary};
    transform: ${(props) => (props.opened ? '' : 'rotate(180deg)')};

    transition: transform 0.3s;

    cursor: pointer;
`;

const StyledChip = styled(Chip)<{ theme?: Theme }>`
    margin-left: 1.5rem;
    border: 1px solid #c4c4c4;
`;

export interface IParamsNFTs {
    handlePriceRange: boolean;
    page?: number;
    categories?: number[];
    orderBy?: string;
    orderDirection?: string;
    priceAtLeast?: number;
    priceAtMost?: number;
    availability?: string[];
}

export interface ITreeCategory {
    id: number | string;
    name: string;
    parent?: ITreeCategory;
    children?: ITreeCategory[];
}

const StorePage = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
    const [preSelectedCategories, setPreSelectedCategories] = useState<any[]>(
        [],
    );
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
    const [onInit, setOnInit] = useState(true);

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

    useEffect(() => {
        if (history.location.state) {
            const state : any = history.location.state
            debugger
            if (state.refresh && state.category) setPreSelectedCategories([state.category]);
        }
    }, [history.location.state])

    const callNFTsEndpoint = (params: IParamsNFTs) => {
        setComfortLoader(true);
        const comfortTrigger = setTimeout(() => {
            getNfts({
                withCredentials: true,
                params: {
                    page: params.page ?? 1,
                    pageSize: 12,
                    categories:
                        params.categories ??
                        selectedCategories.join(',') ??
                        undefined,
                    orderBy:
                        params.orderBy ?? selectedSort?.orderBy ?? 'createdAt',
                    orderDirection:
                        params.orderDirection ??
                        selectedSort?.orderDirection ??
                        'desc',
                    priceAtLeast:
                        params.priceAtLeast ??
                        (params.handlePriceRange && priceFilterRange
                            ? priceFilterRange[0]
                            : undefined),
                    priceAtMost:
                        params.priceAtMost ??
                        (params.handlePriceRange && priceFilterRange
                            ? priceFilterRange[1]
                            : undefined),
                    availability:
                        params.availability ??
                        (selectedAvailability.length === 0
                            ? 'onSale,soldOut,upcoming'
                            : selectedAvailability.join(',')),
                },
            }).then((response) => {
                if (!params.handlePriceRange) {
                    setPriceFilterRange([
                        response.data.lowerPriceBound,
                        response.data.upperPriceBound,
                    ]);
                }
            });
            setComfortLoader(false);
        }, 400);

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
            setPreSelectedCategories(
                categories.split(',').map((categoryId) => Number(categoryId)),
            );
        }

        callNFTsEndpoint({
            handlePriceRange: priceAtLeast !== null && priceAtMost !== null,
            page: page ? Number(page) : 1,
            categories: categories
                ?.split(',')
                .map((categoryId) => Number(categoryId)),
            orderBy: orderBy,
            orderDirection: orderDirection,
            priceAtLeast: priceAtLeast ? Number(priceAtLeast) : undefined,
            priceAtMost: priceAtMost ? Number(priceAtMost) : undefined,
            availability: availability?.split(','),
        });
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
        callNFTsEndpoint({ handlePriceRange: true, page: page });
        window.scrollTo(0, 0);
    };

    const triggerPriceFilter = () => {
        if (priceFilterRange) {
            setPageParams('priceAtLeast', priceFilterRange[0].toString());
            setPageParams('priceAtMost', priceFilterRange[1].toString());
        }
        callNFTsEndpoint({ handlePriceRange: true });
    };

    useEffect(() => {
        if (!onInit) {
            if (selectedSort) {
                setPageParams('orderBy', selectedSort.orderBy);
                setPageParams('orderDirection', selectedSort.orderDirection);
            } else {
                deletePageParams('orderBy');
                deletePageParams('orderDirection');
            }
        }
    }, [selectedSort]);

    useEffect(() => {
        if (!onInit) {
            if (selectedCategories.length)
                setPageParams('categories', selectedCategories.join(','));
            else deletePageParams('categories');
        }
    }, [selectedCategories]);

    useEffect(() => {
        if (!onInit) {
            if (selectedAvailability.length)
                setPageParams('availability', selectedAvailability.join(','));
            else deletePageParams('availability');
        }
    }, [selectedAvailability]);

    const [availableFilters, setAvailableFilters] = useState<ITreeCategory[]>();

    useEffect(() => {
        if (categoriesResponse.data) {
            setAvailableFilters([
                {
                    id: 'root',
                    name: 'Categories',
                    children: categoriesResponse.data,
                },
            ]);
            setOnInit(false);
        }
    }, [categoriesResponse.data]);

    return (
        <PageWrapper>
            <StyledStack direction="column" spacing={3}>
                <FlexSpacer minHeight={isMobile ? 6 : 10} />

                {!isMobile && (
                    <Typography
                        size="h1"
                        weight="SemiBold"
                        sx={{ justifyContent: 'center' }}
                    >
                        The Store
                    </Typography>
                )}

                <FlexSpacer />

                {/* Toggle options */}
                <Stack
                    direction="row"
                    sx={{ justifyContent: 'center', alignItems: 'center' }}
                >
                    <StyledChevronLeftIcon
                        opened={isMobile ? false : filterOpen}
                        onClick={() => setFilterOpen(!filterOpen)}
                    />
                    <Typography
                        size="h4"
                        weight="SemiBold"
                        onClick={() => setFilterOpen(!filterOpen)}
                        sx={{
                            justifyContent: 'center',
                            cursor: 'pointer',
                            paddingLeft: '0.5rem',
                        }}
                    >
                        {`Filters ${
                            selectedCategories.length > 0
                                ? `  - ${selectedCategories.length}`
                                : ''
                        }`}
                    </Typography>
                    {(selectedAvailability.length > 0 ||
                        selectedCategories.length > 0 ||
                        (JSON.stringify(priceFilterRange) !==
                            JSON.stringify([
                                nftsResponse.data?.lowerPriceBound,
                                nftsResponse.data?.upperPriceBound,
                            ]) &&
                            !categoriesResponse.loading &&
                            !nftsResponse.loading)) && (
                        <StyledChip
                            label="Clear all"
                            variant="outlined"
                            onDelete={() => {
                                setSelectedCategories([]);
                                setSelectedAvailability([]);
                                setPriceFilterRange([
                                    nftsResponse.data?.lowerPriceBound,
                                    nftsResponse.data?.upperPriceBound,
                                ]);
                                callNFTsEndpoint({
                                    handlePriceRange: false,
                                    categories: [],
                                    availability: [],
                                });
                            }}
                            sx={{ display: `${isMobile ? 'none' : 'flex'}` }}
                        />
                    )}
                    <FlexSpacer />

                    <CustomSelect
                        id="Sort filter - store page"
                        availableOptions={[{
                            value: JSON.stringify({
                                orderBy: 'name',
                                orderDirection: 'asc',
                            }),
                            label: 'Name: A - Z'
                        },
                        {
                            value: JSON.stringify({
                                orderBy: 'name',
                                orderDirection: 'desc',
                            }),
                            label: 'Name: Z - A'
                        },
                        {
                            value: JSON.stringify({
                                orderBy: 'price',
                                orderDirection: 'desc',
                            }),
                            label: 'Price: High - Low'
                        },
                        {
                            value: JSON.stringify({orderBy: 'price',orderDirection: 'asc'}),
                            label: 'Price: Low - High'
                        },
                        {
                            value: JSON.stringify({
                                orderBy: 'createdAt',
                                orderDirection: 'desc',
                            }),
                            label: 'Created: New - Old'
                        },
                        {
                            value: JSON.stringify({
                                orderBy: 'createdAt',
                                orderDirection: 'asc',
                            }),
                            label: 'Created: Old - New'
                        }
                        ]}
                        selectedOption={JSON.stringify(selectedSort) ?? JSON.stringify({
                            orderBy: 'createdAt',
                            orderDirection: 'desc',
                        })}
                        triggerFunction={(event: SelectChangeEvent) => {
                            const sort: SortProps = {
                                orderBy: JSON.parse(event.target.value).orderBy,
                                orderDirection: JSON.parse(event.target.value).orderDirection,
                            };
                            callNFTsEndpoint({
                                handlePriceRange: true,
                                orderBy: sort.orderBy,
                                orderDirection: sort.orderDirection,
                            });
                            setSelectedSort(JSON.parse(event.target.value));
                        }}
                        disabled={nftsResponse.loading}
                        customSize='big'
                    />
                </Stack>

                <StyledContentStack>
                    <StoreFilters
                        availableFilters={availableFilters}
                        openFilters={isMobile ? !filterOpen : filterOpen}
                        callNFTsEndpoint={callNFTsEndpoint}
                        setFilterOpen={setFilterOpen}
                        preSelectedFilters={preSelectedCategories}
                        selectedFilters={selectedCategories}
                        setSelectedFilters={setSelectedCategories}
                        priceFilterRange={priceFilterRange}
                        setPriceFilterRange={setPriceFilterRange}
                        loading={
                            categoriesResponse.loading && nftsResponse.loading
                        }
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
