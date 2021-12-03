import styled from '@emotion/styled';
import FlexSpacer from '../../atoms/FlexSpacer';
import Typography from '../../atoms/Typography';
import TreeView from '../../molecules/TreeView/TreeView';

import { Checkbox, Stack, Theme } from '@mui/material';
import { FC, useState, useEffect } from 'react';
import PriceFilter from '../../molecules/PriceFilter';

interface FilterProps {
    name: string;
    collapsed: boolean;
    setCollapsed: Function;
    active: boolean;
}

const StyledStack = styled(Stack)`
    align-items: center;
    width: 100%;
    padding-bottom: 1rem;
`;

const Filter: FC<FilterProps> = ({ ...props }) => {
    return (
        <StyledStack
            direction="row"
            onClick={() => props.setCollapsed(props.name)}
        >
            <Typography
                size="h5"
                weight={props.active ? 'SemiBold' : 'Medium'}
                color={props.active ? 'contrastText' : ''}
            >
                {props.name}
            </Typography>

            <FlexSpacer />

            {props.collapsed ? (
                <Typography size="h5" weight="Light">
                    +
                </Typography>
            ) : (
                <Typography size="h5" weight="Light">
                    -
                </Typography>
            )}
        </StyledStack>
    );
};

interface StyledStoreFiltersProps {
    openFilters?: boolean;
    collapsed?: boolean;
}

interface StoreFiltersProps extends StyledStoreFiltersProps {
    selectedFilters: number[];
    setSelectedFilters: Function;
    availableFilters: any[];
    loading: boolean;
    priceFilterRange?: [number, number];
    setPriceFilterRange: Function;
    minRange: number;
    maxRange: number;
    availabilityFilter: string[];
    triggerPriceFilter: () => void;
    setAvailabilityFilter: (input: string[]) => void;
    setFilterSliding: (input: boolean) => void;
    callNFTsEndpoint: (input: boolean) => void;
}

const StyledUl = styled.ul<StyledStoreFiltersProps>`
    width: 100%;
    padding: 0 0;
    transition: width 0.2s;

    @media (min-width: 900px) {
        width: ${(props) => (props.openFilters ? '25rem' : '0')};
        margin-right: ${(props) => (props.openFilters ? '2.5rem' : '0')};
    }
`;

const StyledLi = styled.li<StyledStoreFiltersProps>`
    cursor: pointer;

    display: ${(props) => (props.openFilters ? 'flex' : 'none')};
    padding-top: 1rem;
    flex-direction: column;

    border-top: 1px solid #c4c4c4;

    height: auto;
`;

const StyledCheckBox = styled(Checkbox)<{ theme?: Theme }>`
    &.Mui-checked {
        color: ${(props) => props.theme.palette.text.primary} !important;
    }
`;

export const StoreFilters: FC<StoreFiltersProps> = ({
    callNFTsEndpoint,
    children,
    ...props
}) => {
    const [activeRef, setActiveRef] = useState<string[]>([]);
    const [availabilityChange, setAvailabilityChange] =
        useState<boolean>(false);

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
        if (availabilityChange) {
            setAvailabilityChange(false);
            callNFTsEndpoint(true);
        }
    }, [availabilityChange]);

    return (
        <StyledUl openFilters={props.openFilters}>
            <Stack
                direction="row"
                sx={{ display: `${props.openFilters ? 'flex' : 'none'}` }}
            >
                <FlexSpacer />
                <Typography
                    onClick={() => props.setSelectedFilters([])}
                    size="subtitle2"
                    weight={
                        props.selectedFilters.length > 0 ? 'Medium' : 'Light'
                    }
                    color={
                        props.selectedFilters.length > 0
                            ? 'contrastText'
                            : '#C4C4C4'
                    }
                    sx={{ paddingBottom: '0.5rem' }}
                >
                    Clear All
                </Typography>
            </Stack>
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
                    active={false}
                    collapsed={activeRef.indexOf('Availability') !== -1}
                    setCollapsed={handleListItemClick}
                />

                {activeRef.indexOf('Availability') === -1 && (
                    <Stack direction="column" sx={{ marginBottom: '1rem' }}>
                        <Stack direction="row">
                            <StyledCheckBox
                                checked={
                                    props.availabilityFilter.indexOf(
                                        'onSale',
                                    ) !== -1 &&
                                    props.availabilityFilter.length !== 0
                                }
                                onClick={() =>
                                    handleChangeAvailabilityFilter('onSale')
                                }
                                inputProps={{ 'aria-label': 'controlled' }}
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
                                    props.availabilityFilter.length !== 0
                                }
                                onClick={() =>
                                    handleChangeAvailabilityFilter('upcoming')
                                }
                                inputProps={{ 'aria-label': 'controlled' }}
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
                                    props.availabilityFilter.length !== 0
                                }
                                onClick={() =>
                                    handleChangeAvailabilityFilter('soldOut')
                                }
                                inputProps={{ 'aria-label': 'controlled' }}
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
                    active={false}
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
    );
};
