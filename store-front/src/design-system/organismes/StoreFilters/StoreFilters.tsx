import styled from '@emotion/styled'
import FlexSpacer from '../../atoms/FlexSpacer'
import Typography from '../../atoms/Typography'
import TreeView from '../../molecules/TreeView/TreeView'

import { Stack } from '@mui/material'
import { FC, useState } from 'react'
import PriceFilter from '../../molecules/PriceFilter'

interface FilterProps {
    name: string
    collapsed: boolean
    setCollapsed: Function
    active: boolean
}

const StyledStack = styled(Stack)`
    align-items: center;
    width: 100%;
    padding-bottom: 1rem;
`

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
    )
}

interface StyledStoreFiltersProps {
    openFilters?: boolean
    collapsed?: boolean
}

interface StoreFiltersProps extends StyledStoreFiltersProps {
    selectedFilters: number[]
    setSelectedFilters: Function
    availableFilters: any[]
    filterFunction: Function
    loading: boolean
}

const StyledUl = styled.ul<StyledStoreFiltersProps>`
    width: 100%;
    padding: 0 0;
    transition: width 0.2s;

    @media (min-width: 900px) {
        width: ${(props) => (props.openFilters ? '25rem' : '0')};
        margin-right: ${(props) => (props.openFilters ? '2.5rem' : '0')};
    }
`

const StyledLi = styled.li<StyledStoreFiltersProps>`
    cursor: pointer;

    display: ${(props) => (props.openFilters ? 'flex' : 'none')};
    padding-top: 1rem;
    flex-direction: column;

    border-top: 1px solid #c4c4c4;

    height: auto;
`


export const StoreFilters: FC<StoreFiltersProps> = ({ children, ...props }) => {
    const [activeRef, setActiveRef] = useState<string[]>([])
    const [range, setRange] = useState<[number, number]>([0, 20])

    const handleListItemClick = (concernedRef: string) => {
        if (activeRef.indexOf(concernedRef) !== -1) {
            setActiveRef(
                activeRef.filter((ref: string) => ref !== concernedRef),
            )
        } else {
            setActiveRef([...activeRef, concernedRef])
        }
    }

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
                    filterFunction={props.filterFunction}
                    selectedFilters={props.selectedFilters}
                    setSelectedFilters={props.setSelectedFilters}
                    collapsed={activeRef.indexOf('Categories') !== -1}
                />
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
                        range={range}
                        setRange={setRange}
                    />
                )}
            </StyledLi>
        </StyledUl >
    )
}
