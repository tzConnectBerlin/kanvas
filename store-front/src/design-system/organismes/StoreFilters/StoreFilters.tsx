import styled from '@emotion/styled';
import FlexSpacer from '../../atoms/FlexSpacer';
import Typography from '../../atoms/Typography';
import TreeView from '../../molecules/TreeView/TreeView';

import { Checkbox, Stack, Theme, useMediaQuery } from '@mui/material';
import { FC, useCallback, useEffect, useState } from 'react';
import PriceFilter from '../../molecules/PriceFilter';
import { ArrowBackIosNew } from '@mui/icons-material';
import { useTheme } from '@mui/system';
import { useTranslation } from 'react-i18next';
import CustomButton from '../../atoms/Button';
import { IParamsNFTs, ITreeCategory } from '../../../pages/StorePage';

interface FilterProps {
    name: string;
    collapsed: boolean;
    setCollapsed: Function;
    active: boolean;
}

const StyledStack = styled(Stack) <{ selected?: boolean, theme?: Theme }>`
    align-items: center;
    width: 100%;
    padding-bottom: 1rem;
`;

const StyledTypography = styled(Typography) <{ selected?: boolean, theme?: Theme }>`
    border-left: ${props => props.selected ? `2px solid ${props.theme.palette.primary.contrastText}` : 'none'};
    height: 2rem;
    padding-left: ${props => props.selected ? `1rem` : '0'};
    margin-left: ${props => props.selected ? '-1rem' : 0};
`

const Filter: FC<FilterProps> = ({ ...props }) => {
    return (
        <StyledStack
            direction="row"
            onClick={() => props.setCollapsed(props.name)}
            selected={props.active}
        >
            <StyledTypography
                size="h5"
                weight={'SemiBold'}
                color={props.active ? 'contrastText' : ''}
                selected={props.active}
            >
                {props.name}
            </StyledTypography>

            <FlexSpacer />

            {props.collapsed ? (
                <Typography size="h5" weight="Light" color={props.active ? 'contrastText' : ''}>
                    +
                </Typography>
            ) : (
                <Typography size="h5" weight="Light" color={props.active ? 'contrastText' : ''}>
                    -
                </Typography>
            )}
        </StyledStack>
    );
};

interface StyledStoreFiltersProps {
    openFilters?: boolean;
    collapsed?: boolean;
    theme?: Theme;
}

interface StoreFiltersProps extends StyledStoreFiltersProps {
    preSelectedFilters: number[];
    selectedFilters: number[];
    setSelectedFilters: Function;
    availableFilters: ITreeCategory[] | undefined;
    loading: boolean;
    priceFilterRange?: [number, number];
    setPriceFilterRange: Function;
    minRange: number;
    maxRange: number;
    setFilterOpen: Function;
    filterFunction?: Function;
    availabilityFilter: string[];
    triggerPriceFilter: () => void;
    setAvailabilityFilter: (input: string[]) => void;
    setFilterSliding: (input: boolean) => void;
    openFilters?: boolean;
    collapsed?: boolean;
    callNFTsEndpoint: (input: IParamsNFTs) => void;
}

const BackButton = styled(ArrowBackIosNew) <StyledStoreFiltersProps>`
    fill: ${(props) => props.theme.palette.text.primary};
`;

const StyledSection = styled.section<StyledStoreFiltersProps>`
    display: block;
    position: relative;
    padding: 0 0;
    transition: width 0.2s;
    margin-right: ${(props) => (props.openFilters ? '2.5rem' : '0')};
    -webkit-overflow-scrolling: touch;

    @media (max-width: 874px) {
        flex-direction: column;
        display: none;
        max-width: ${(props) => (props.openFilters ? 100 : 0)}rem;
        width: ${(props) => (props.openFilters ? '100%' : '0')};
        display: flex;
        height: 100vh;
        position: fixed;
        left: 0;
        top: 5rem;
        bottom: 0;
        z-index: 1;

        overflow: scroll;

        margin-top: 0 !important;
        margin-right: 0;

        background-color: ${(props) => props.theme.palette.background.paper};
        opacity: 1;

        p,
        a {
            opacity: ${(props) => (props.openFilters ? 1 : 0)} !important;
            transition: opacity 0.3s;
        }

        transition: max-width 0.3s, width 0.3s, padding 0.5s;
    }

    @media (min-width: 874px) {
        height: fit-content;

        width: ${(props) => (props.openFilters ? '25rem' : '0')};
        margin-right: ${(props) => (props.openFilters ? '1rem' : '0')};
        padding: 0;
        margin-top: 0;
    }
`;

const StyledUl = styled.ul<StyledStoreFiltersProps>`
    display: flex;
    flex-direction: column;
    width: initial;
    min-height: max-content;
    height: max-content;
    transition: width 0.2s ease 0s;

    padding: 0 1.5rem 0;
    /* margin-top: 3rem; */

    @media (min-width: 874px) {
        margin-top: 0;
        padding: 0.5rem 1.5rem 0 0;
    }

    &:first-child {
        padding-top: 0 !important;

        li {
            padding-top: 0 !important;
        }
    }
`;
const StyledLi = styled.li<StyledStoreFiltersProps>`
    display: ${(props) => (props.openFilters ? 'flex' : 'none')};
    padding-top: 1rem;
    flex-direction: column;
    margin-left: 1rem;
    /* border-top: 1px solid #c4c4c4; */
    height: max-content;
    cursor: pointer;
`;

const StyledHeader = styled(Stack) <StyledStoreFiltersProps>`
    position: fixed;
    width: -webkit-fill-available;
    padding: 0.5rem 1.5rem 0;
    z-index: 1;

    @media (max-width: 874px) {
        padding: 2rem 1.5rem 0.5rem;
        background-color: ${(props) => props.theme.palette.background.paper};
    }

    @media (min-width: 900px) {
        position: relative;
        opacity: 1;
    }
`;

const StyledFooter = styled(Stack) <StyledStoreFiltersProps>`
    display: flex;
    padding: 0.5rem 1.5rem 1rem;
    min-height: 12rem;
    z-index: 1;
`;

const StyledCheckBox = styled(Checkbox) <{ theme?: Theme }>`
    &.Mui-checked {
        color: ${props => props.theme.palette.primary.contrastText} !important;
    }
`;

export const StoreFilters: FC<StoreFiltersProps> = ({
    callNFTsEndpoint,
    children,
    ...props
}) => {
    const [activeRef, setActiveRef] = useState<string[]>([]);
    const { t } = useTranslation(['translation']);
    const theme = useTheme();
    const [availabilityChange, setAvailabilityChange] =
        useState<boolean>(false);

    const isMobile = useMediaQuery('(max-width:900px)');
    const handleListItemClick = (concernedRef: string) => {
        if (activeRef.indexOf(concernedRef) !== -1) {
            setActiveRef(
                activeRef.filter((ref: string) => ref !== concernedRef),
            );
        } else {
            setActiveRef([...activeRef, concernedRef]);
        }
    };

    const handleChangeAvailabilityFilter = (availabilityParam: string) => {
        if (props.availabilityFilter.indexOf(availabilityParam) === -1) {
            props.setAvailabilityFilter([
                ...props.availabilityFilter,
                availabilityParam,
            ]);
        } else {
            props.setAvailabilityFilter(
                props.availabilityFilter.filter(
                    (param) => param !== availabilityParam,
                ),
            );
        }
        setAvailabilityChange(true);
    };

    useEffect(() => {
        if (props.openFilters && isMobile) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        if (availabilityChange) {
            console.log(props.availabilityFilter)
            callNFTsEndpoint({ handlePriceRange: false })

            setAvailabilityChange(false)
        }
    }, [props.openFilters, isMobile, availabilityChange]);

    return (
        <StyledSection openFilters={props.openFilters}>
            {isMobile &&
                <StyledHeader
                    direction="row"
                    sx={{ display: `${props.openFilters ? 'flex' : 'none'}` }}
                    p={isMobile ? '2rem 1.5rem 0rem' : '0 0 .5rem 0'}
                >
                    <BackButton
                        fill="#fff"
                        onClick={() => props.setFilterOpen(true)}
                        sx={{
                            cursor: 'pointer',
                            marginBottom: '0.7rem',
                        }}
                    />

                    <Typography
                        p="0  1.5rem .5rem 0"
                        onClick={() => props.setSelectedFilters([])}
                        size="h2"
                        ml={2}
                        weight={
                            props.selectedFilters.length > 0
                                ? 'Medium'
                                : 'Light'
                        }
                        sx={{ lineHeight: 1.1 }}
                    >
                        Filters
                    </Typography>

                    <FlexSpacer />

                    <Typography
                        onClick={() => {
                            props.setSelectedFilters([]);
                            props.setAvailabilityFilter([]);
                            props.setPriceFilterRange([props.minRange, props.maxRange]);
                            callNFTsEndpoint({ handlePriceRange: false, categories: [], availability: [] });
                        }}
                        size="subtitle2"
                        weight={
                            props.selectedFilters.length > 0 || props.availabilityFilter.length > 0
                                ? 'Medium'
                                : 'Light'
                        }
                        color={
                            props.selectedFilters.length > 0 || props.availabilityFilter.length > 0
                                ? 'contrastText'
                                : '#C4C4C4'
                        }
                        sx={{ paddingBottom: '0.5rem', cursor: 'pointer !important' }}
                        noWrap
                    >
                        Clear All
                    </Typography>
                </StyledHeader>
            }

            <Stack
                direction="column"
                sx={{ overflow: 'auto', marginBottom: '6rem' }}
            >
                <StyledUl openFilters={props.openFilters}>
                    <StyledLi
                        openFilters={props.openFilters}
                        collapsed={activeRef.indexOf('Categories') !== -1}
                    >
                        <Filter
                            name="Categories"
                            collapsed={activeRef.indexOf('Categories') !== -1}
                            active={props.selectedFilters.length > 0}
                            setCollapsed={handleListItemClick}
                        />
                        <TreeView
                            loading={props.loading}
                            open={props.openFilters}
                            nodes={props.availableFilters}
                            preSelectedFilters={props.preSelectedFilters}
                            selectedFilters={props.selectedFilters}
                            callNFTsEndpoint={callNFTsEndpoint}
                            setSelectedFilters={props.setSelectedFilters}
                            collapsed={activeRef.indexOf('Categories') !== -1}
                        />
                    </StyledLi>
                    <StyledLi
                        openFilters={props.openFilters}
                        collapsed={activeRef.indexOf('Availability') !== -1}
                    >
                        <Filter
                            name="Availability"
                            active={props.availabilityFilter.length > 0}
                            collapsed={activeRef.indexOf('Availability') !== -1}
                            setCollapsed={handleListItemClick}
                        />

                        {activeRef.indexOf('Availability') === -1 && (
                            <Stack
                                direction="column"
                                sx={{ marginBottom: '1rem' }}
                            >
                                <Stack direction="row">
                                    <StyledCheckBox
                                        checked={
                                            props.availabilityFilter.indexOf(
                                                'onSale',
                                            ) !== -1 &&
                                            props.availabilityFilter.length !==
                                            0
                                        }
                                        onClick={() =>
                                            handleChangeAvailabilityFilter(
                                                'onSale',
                                            )
                                        }
                                        inputProps={{
                                            'aria-label': 'controlled',
                                        }}
                                        disableRipple
                                    />
                                    <Typography size="h5" weight="Light">
                                        On sale
                                    </Typography>
                                </Stack>
                                <Stack direction="row">
                                    <StyledCheckBox
                                        checked={
                                            props.availabilityFilter.indexOf(
                                                'upcoming',
                                            ) !== -1 &&
                                            props.availabilityFilter.length !==
                                            0
                                        }
                                        onClick={() =>
                                            handleChangeAvailabilityFilter(
                                                'upcoming',
                                            )
                                        }
                                        inputProps={{
                                            'aria-label': 'controlled',
                                        }}
                                        disableRipple
                                    />
                                    <Typography size="h5" weight="Light">
                                        Upcoming
                                    </Typography>
                                </Stack>
                                <Stack direction="row">
                                    <StyledCheckBox
                                        checked={
                                            props.availabilityFilter.indexOf(
                                                'soldOut',
                                            ) !== -1 &&
                                            props.availabilityFilter.length !==
                                            0
                                        }
                                        onClick={() =>
                                            handleChangeAvailabilityFilter(
                                                'soldOut',
                                            )
                                        }
                                        inputProps={{
                                            'aria-label': 'controlled',
                                        }}
                                        disableRipple
                                    />
                                    <Typography size="h5" weight="Light">
                                        Sold out
                                    </Typography>
                                </Stack>
                            </Stack>
                        )}
                    </StyledLi>
                    <StyledLi openFilters={props.openFilters}>
                        <Filter
                            name="Price"
                            active={JSON.stringify(props.priceFilterRange) !== JSON.stringify([props.minRange, props.maxRange])}
                            collapsed={activeRef.indexOf('Price') !== -1}
                            setCollapsed={handleListItemClick}
                        />

                        {activeRef.indexOf('Price') === -1 && (
                            <PriceFilter
                                minRange={props.minRange}
                                maxRange={props.maxRange}
                                range={props.priceFilterRange}
                                setRange={props.setPriceFilterRange}
                                triggerPriceFilter={props.triggerPriceFilter}
                                setFilterSliding={props.setFilterSliding}
                            />
                        )}
                    </StyledLi>
                </StyledUl>
                {isMobile && (
                    <>
                        <StyledFooter
                            direction="column-reverse"
                            minHeight="6rem"
                        >
                            <FlexSpacer borderBottom={false} minHeight={3} />
                            <CustomButton
                                fullWidth={!!isMobile}
                                color="secondary"
                                type="submit"
                                onClick={() => props.setSelectedFilters([])}
                                label={t('filters.button.reset')}
                                style={{
                                    outline: 'none',
                                }}
                            ></CustomButton>

                            <CustomButton
                                fullWidth={true}
                                color="secondary"
                                type="submit"
                                label={t('filters.button.results')}
                                onClick={() => props.setFilterOpen(true)}
                                style={{
                                    order: isMobile ? 99 : 0,
                                    color: theme.palette.primary.main,
                                    alignSelf: 'flex-start',
                                    height: '2.5rem',
                                }}
                            ></CustomButton>
                        </StyledFooter>
                    </>
                )}
            </Stack>
        </StyledSection>
    );
};
