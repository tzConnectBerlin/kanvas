import styled from '@emotion/styled'
import FlexSpacer from '../../atoms/FlexSpacer'
import Typography from '../../atoms/Typography'
import TreeView from '../../molecules/TreeView/TreeView'

import { Stack } from '@mui/material'
import { FC, useState } from 'react'

interface FilterProps {
    name: string
    collapsed: boolean
    setCollapsed: Function
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
            <Typography size="h5" weight="Light">
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
    padding: 1.5rem 0;
    transition: width 0.2s;

    @media (min-width: 900px) {
        width: ${(props) => (props.openFilters ? '15rem' : '0')};
        margin-right: ${(props) => (props.openFilters ? '1.5rem' : '0')};
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
            {/* TODO: map over list of filters taken from the backend - Need to check with the backend team */}
            <StyledLi
                openFilters={props.openFilters}
                collapsed={activeRef.indexOf('Categories') !== -1}
            >
                <Filter
                    name="Categories"
                    collapsed={activeRef.indexOf('Categories') !== -1}
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
                    collapsed={activeRef.indexOf('Price') !== -1}
                    setCollapsed={handleListItemClick}
                />
                {/* TODO */}
                {activeRef.indexOf('Price') === -1 ? (
                    <Typography size="h5" weight="Light" color="red">
                        {' '}
                        Not implemented{' '}
                    </Typography>
                ) : undefined}
            </StyledLi>
        </StyledUl>
    )
}
